import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  const signature = request.headers.get('polar-signature');

  if (!secret || !signature) {
    return NextResponse.json({ error: 'Webhook secret or signature missing' }, { status: 400 });
  }

  let event;
  try {
    const rawBody = await request.text();
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const digest = hmac.digest('hex');

    if (digest !== signature) {
      console.warn('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('Error parsing webhook or verifying signature:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 400 });
  }

  console.log('Received Polar digital products webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.completed':
        const checkout = event.data;
        const metadata = checkout.metadata;

        // Only handle digital product purchases
        if (metadata?.type === 'digital_product_purchase') {
          await handleDigitalProductPurchase(checkout);
        }
        break;

      case 'order.created':
        const order = event.data;
        const orderMetadata = order.metadata;

        // Handle digital product orders
        if (orderMetadata?.type === 'digital_product_purchase') {
          await handleDigitalProductOrder(order);
        }
        break;

      default:
        console.log(`Unhandled digital products event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing Polar digital products webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleDigitalProductPurchase(checkoutData) {
  try {
    const { metadata } = checkoutData;
    const { user_id, product_id, creator_id } = metadata;

    console.log(`Processing digital product purchase: Product ${product_id} for user ${user_id}`);

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
        revenue: parseFloat(product.revenue) + parseFloat(product.price),
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
          balance: parseFloat(creatorFunds.balance) + creatorEarnings,
          total_earned: parseFloat(creatorFunds.total_earned) + creatorEarnings,
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
    console.log(`💰 Creator earnings: $${creatorEarnings}, Platform fee: $${platformFee}`);

  } catch (error) {
    console.error('Error processing digital product purchase:', error);
    throw error;
  }
}

async function handleDigitalProductOrder(orderData) {
  try {
    const { metadata } = orderData;
    console.log(`Digital product order created: ${orderData.id}`, metadata);
    
    // Additional order processing if needed
    // This runs after checkout.completed, so main processing is already done
    
  } catch (error) {
    console.error('Error processing digital product order:', error);
    throw error;
  }
}