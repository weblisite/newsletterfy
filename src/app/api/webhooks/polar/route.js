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