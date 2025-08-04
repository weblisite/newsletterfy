import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.text();
    const signature = request.headers.get('Polar-Webhook-Signature');
    
    // Verify webhook signature (recommended for production)
    if (process.env.POLAR_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.POLAR_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
      
      if (signature !== `sha256=${expectedSignature}`) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const { type, data } = event;

    console.log(`Processing Polar webhook: ${type}`);

    switch (type) {
      case 'subscription.created':
        await handleSubscriptionCreated(supabase, data);
        break;
        
      case 'subscription.updated':
        await handleSubscriptionUpdated(supabase, data);
        break;
        
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(supabase, data);
        break;
        
      case 'order.created':
        await handleOrderCreated(supabase, data);
        break;
        
      case 'checkout.completed':
        await handleCheckoutCompleted(supabase, data);
        break;
        
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Polar webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSubscriptionCreated(supabase, subscription) {
  try {
    const metadata = subscription.metadata || {};
    const planType = metadata.plan_type || 'Pro';
    const subscriberTier = parseInt(metadata.subscriber_tier) || 1000;
    const userId = metadata.user_id;

    // First, find the user by email if user_id is not provided
    let finalUserId = userId;
    if (!userId && subscription.customer?.email) {
      const { data: user } = await supabase.auth.admin.getUserByEmail(subscription.customer.email);
      finalUserId = user?.user?.id;
    }

    if (!finalUserId) {
      console.error('No user ID found for subscription:', subscription.id);
      throw new Error('User ID not found');
    }

    // Create or update platform subscription record
    const { error: subscriptionError } = await supabase
      .from('platform_subscriptions')
      .upsert({
        user_id: finalUserId,
        polar_subscription_id: subscription.id,
        polar_checkout_id: metadata.checkout_id,
        plan_type: planType,
        subscriber_limit: subscriberTier,
        status: subscription.status.toLowerCase(),
        payment_status: 'active',
        amount: subscription.amount / 100, // Polar amounts are in cents
        currency: subscription.currency || 'USD',
        billing_cycle: subscription.recurringInterval || 'monthly',
        current_period_start: subscription.currentPeriodStart,
        current_period_end: subscription.currentPeriodEnd,
        payment_provider: 'polar',
        customer_name: subscription.customer?.name || metadata.customer_name,
        customer_email: subscription.customer?.email || metadata.customer_email,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'polar_subscription_id',
        ignoreDuplicates: false 
      });

    if (subscriptionError) {
      console.error('Error updating platform subscription:', subscriptionError);
      throw subscriptionError;
    }

    // Update user plan in users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        plan_type: planType,
        subscriber_limit: subscriberTier,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', finalUserId);

    if (userError) {
      console.error('Error updating user plan:', userError);
      throw userError;
    }

    console.log(`Platform subscription created successfully: ${subscription.id} for user: ${finalUserId}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(supabase, subscription) {
  try {
    const { error } = await supabase
      .from('platform_subscriptions')
      .update({
        status: subscription.status.toLowerCase(),
        current_period_start: subscription.currentPeriodStart,
        current_period_end: subscription.currentPeriodEnd,
        payment_status: subscription.status.toLowerCase() === 'active' ? 'active' : 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('polar_subscription_id', subscription.id);

    if (error) throw error;

    console.log(`Platform subscription updated: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(supabase, subscription) {
  try {
    // Get the platform subscription to find the user_id
    const { data: platformSub, error: fetchError } = await supabase
      .from('platform_subscriptions')
      .select('user_id')
      .eq('polar_subscription_id', subscription.id)
      .single();

    if (fetchError) {
      console.error('Error fetching platform subscription:', fetchError);
      throw fetchError;
    }

    // Update platform subscription status
    const { error: subscriptionError } = await supabase
      .from('platform_subscriptions')
      .update({
        status: 'cancelled',
        payment_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('polar_subscription_id', subscription.id);

    if (subscriptionError) throw subscriptionError;

    // Downgrade user to Free plan
    if (platformSub?.user_id) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          plan_type: 'Free',
          subscriber_limit: 1000,
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', platformSub.user_id);

      if (userError) {
        console.error('Error downgrading user to Free plan:', userError);
        throw userError;
      }
    }

    console.log(`Platform subscription cancelled: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
    throw error;
  }
}

async function handleOrderCreated(supabase, order) {
  try {
    const metadata = order.metadata || {};
    
    // Find user by email if user_id is not provided
    let userId = metadata.user_id;
    if (!userId && order.customer?.email) {
      const { data: user } = await supabase.auth.admin.getUserByEmail(order.customer.email);
      userId = user?.user?.id;
    }

    // Handle one-time purchases (like Enterprise plan consultations)
    const { error } = await supabase
      .from('platform_orders')
      .insert([{
        user_id: userId,
        polar_order_id: order.id,
        amount: order.amount / 100, // Convert from cents
        currency: order.currency || 'USD',
        status: order.status.toLowerCase(),
        customer_name: order.customer?.name || metadata.customer_name,
        customer_email: order.customer?.email || metadata.customer_email,
        payment_provider: 'polar',
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;

    console.log(`Platform order created: ${order.id} for user: ${userId}`);
  } catch (error) {
    console.error('Error handling order created:', error);
    throw error;
  }
}

async function handleCheckoutCompleted(supabase, checkout) {
  try {
    const { metadata, product } = checkout;
    
    // Check if this is a wallet deposit (our Wallet Credit product)
    if (product?.id === 'dc1b813a-6858-4cb9-adbe-153cee6146ed' || metadata?.type === 'wallet_deposit') {
      await handleWalletDepositSuccess(supabase, checkout);
    } else if (metadata?.type === 'digital_product_purchase' || isDigitalProductPurchase(product?.id)) {
      // Handle digital product purchases
      await handleDigitalProductPurchaseSuccess(supabase, checkout);
    } else {
      // Handle other checkout completions (regular product purchases)
      console.log(`Checkout completed for product: ${product?.name || 'Unknown'}`);
    }
  } catch (error) {
    console.error('Error handling checkout completed:', error);
    throw error;
  }
}

async function handleWalletDepositSuccess(supabase, checkoutData) {
  try {
    const { metadata, amount, customer } = checkoutData;
    const { user_id, amount: depositAmount, reference, description } = metadata;

    console.log(`Processing wallet deposit: $${depositAmount} for user ${user_id}`);

    // Initialize Supabase Admin Client for server-side operations
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Update transaction status to completed
    const { error: transactionUpdateError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        polar_payment_data: checkoutData
      })
      .eq('reference_id', reference)
      .eq('user_id', user_id);

    if (transactionUpdateError) {
      console.error('Error updating transaction:', transactionUpdateError);
      throw transactionUpdateError;
    }

    // Get or create user's wallet/funds record
    let { data: userFunds, error: fundsError } = await supabaseAdmin
      .from('user_funds')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (fundsError && fundsError.code !== 'PGRST116') { // Not found error is OK
      console.error('Error fetching user funds:', fundsError);
      throw fundsError;
    }

    const depositAmountFloat = parseFloat(depositAmount);

    if (!userFunds) {
      // Create new funds record
      const { data: newFunds, error: createFundsError } = await supabaseAdmin
        .from('user_funds')
        .insert([{
          user_id: user_id,
          balance: depositAmountFloat,
          total_deposited: depositAmountFloat,
          total_earned: 0,
          total_spent: 0,
          total_withdrawn: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createFundsError) {
        console.error('Error creating user funds:', createFundsError);
        throw createFundsError;
      }

      console.log(`Created new wallet for user ${user_id} with $${depositAmountFloat}`);
    } else {
      // Update existing funds record
      const newBalance = (userFunds.balance || 0) + depositAmountFloat;
      const newTotalDeposited = (userFunds.total_deposited || 0) + depositAmountFloat;

      const { error: updateFundsError } = await supabaseAdmin
        .from('user_funds')
        .update({
          balance: newBalance,
          total_deposited: newTotalDeposited,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id);

      if (updateFundsError) {
        console.error('Error updating user funds:', updateFundsError);
        throw updateFundsError;
      }

      console.log(`Updated wallet for user ${user_id}: +$${depositAmountFloat} (New balance: $${newBalance})`);
    }

    console.log(`✅ Wallet deposit completed successfully for user ${user_id}`);

  } catch (error) {
    console.error('Error processing wallet deposit:', error);
    throw error;
  }
}

async function handleDigitalProductPurchaseSuccess(supabase, checkoutData) {
  try {
    const { metadata } = checkoutData;
    const { user_id, product_id, creator_id } = metadata;

    console.log(`Processing digital product purchase: Product ${product_id} for user ${user_id}`);

    // Initialize Supabase Admin Client for server-side operations
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Update purchase status to completed
    const { data: purchase, error: purchaseUpdateError } = await supabaseAdmin
      .from('digital_product_purchases')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        polar_checkout_data: checkoutData
      })
      .eq('polar_checkout_id', checkoutData.id)
      .eq('buyer_id', user_id)
      .select()
      .single();

    if (purchaseUpdateError) {
      console.error('Error updating purchase status:', purchaseUpdateError);
      throw purchaseUpdateError;
    }

    // Get product details for delivery
    const { data: product, error: productError } = await supabaseAdmin
      .from('digital_products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError) {
      console.error('Error fetching product details:', productError);
      throw productError;
    }

    // Create delivery record with download access
    const { error: deliveryError } = await supabaseAdmin
      .from('digital_product_deliveries')
      .insert([{
        purchase_id: purchase.id,
        delivery_method: 'download',
        delivered_at: new Date().toISOString(),
        download_url: product.file_url,
        access_expires_at: null, // Permanent access
      }]);

    if (deliveryError) {
      console.error('Error creating delivery record:', deliveryError);
      throw deliveryError;
    }

    // Update product sales count and revenue
    await supabaseAdmin
      .from('digital_products')
      .update({
        sales: product.sales + 1,
        revenue: parseFloat(product.revenue || 0) + parseFloat(product.price),
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id);

    // Calculate and record creator earnings (80% to creator, 20% platform fee)
    const creatorEarnings = parseFloat(product.price) * 0.8;
    const platformFee = parseFloat(product.price) * 0.2;

    // Add to creator's funds
    const { data: creatorFunds, error: fundsError } = await supabaseAdmin
      .from('user_funds')
      .select('balance, total_earned')
      .eq('user_id', creator_id)
      .single();

    if (fundsError && fundsError.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching creator funds:', fundsError);
    }

    if (creatorFunds) {
      // Update existing funds
      await supabaseAdmin
        .from('user_funds')
        .update({
          balance: parseFloat(creatorFunds.balance || 0) + creatorEarnings,
          total_earned: parseFloat(creatorFunds.total_earned || 0) + creatorEarnings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', creator_id);
    } else {
      // Create new funds record
      await supabaseAdmin
        .from('user_funds')
        .insert([{
          user_id: creator_id,
          balance: creatorEarnings,
          total_earned: creatorEarnings,
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
    }

    // Record transaction
    await supabaseAdmin
      .from('payment_transactions')
      .insert([{
        user_id: creator_id,
        type: 'earn',
        amount: creatorEarnings,
        description: `Digital product sale: ${product.name}`,
        reference_id: purchase.id,
        reference_type: 'digital_product_purchase',
        status: 'completed',
        payment_provider: 'polar',
        created_at: new Date().toISOString()
      }]);

    console.log(`✅ Digital product purchase completed: ${product.name} for user ${user_id}`);
    console.log(`💰 Creator earnings: $${creatorEarnings.toFixed(2)}, Platform fee: $${platformFee.toFixed(2)}`);

  } catch (error) {
    console.error('Error processing digital product purchase:', error);
    throw error;
  }
}

// Helper function to check if a product ID is for digital products
function isDigitalProductPurchase(productId) {
  const digitalProductIds = [
    '9710943f-f936-4e46-9bd9-6e3c5ee44fd7', // Digital Course
    '3a6b7d86-d81a-4f42-90ff-4002b1c2584b', // Digital eBook
    '98c07570-6069-4b25-8eae-a8e6c7201736', // Digital Template
    '6afd7dd9-849d-47f2-bad9-0d0e932fa0c3', // Software Tool
  ];
  return digitalProductIds.includes(productId);
}