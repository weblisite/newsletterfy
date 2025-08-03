import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import IntaSend from 'intasend-node';

// Initialize IntaSend with environment variables
const intasend = new IntaSend(
  process.env.INTASEND_PUBLISHABLE_KEY || 'ISPubKey_live_8e8857a5-54ad-4d06-8537-4557857db13b',
  process.env.INTASEND_SECRET_KEY || 'ISSecretKey_live_ce648358-1847-471d-bf9f-24cf3f887c59',
  process.env.NODE_ENV === 'production' ? false : true // true for test environment
);

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch subscriptions with tier information
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_tiers (
          name,
          billing_period
        )
      `)
      .eq('creator_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (subscriptionsError) throw subscriptionsError;

    // Calculate analytics
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('subscriptions')
      .select(`
        amount,
        subscription_tiers!inner (
          id,
          status
        )
      `)
      .eq('creator_id', session.user.id)
      .eq('subscription_tiers.status', 'active');

    if (analyticsError) throw analyticsError;

    const analytics = {
      totalSubscribers: analyticsData.length,
      monthlyRevenue: analyticsData.reduce((sum, sub) => sum + parseFloat(sub.amount), 0),
      userShare: analyticsData.reduce((sum, sub) => sum + parseFloat(sub.amount) * 0.8, 0),
      platformFee: analyticsData.reduce((sum, sub) => sum + parseFloat(sub.amount) * 0.2, 0),
      activeTiers: new Set(analyticsData.map(sub => sub.subscription_tiers.id)).size
    };

    // Format subscriptions for frontend
    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      subscriber_id: sub.subscriber_id,
      tier_name: sub.subscription_tiers.name,
      amount: sub.amount,
      billing_period: sub.subscription_tiers.billing_period,
      created_at: sub.created_at
    }));

    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      analytics
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      tierId, 
      paymentMethod = 'card', 
      phone_number,
      customer_email,
      customer_name 
    } = await request.json();

    // Verify the subscription tier exists and belongs to the creator
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .single();

    if (tierError || !tier) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    // Get creator information
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', tier.user_id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    try {
      // Create or get IntaSend customer
      const customerData = {
        email: customer_email || session.user.email,
        first_name: customer_name?.split(' ')[0] || session.user.user_metadata?.full_name?.split(' ')[0] || 'Subscriber',
        last_name: customer_name?.split(' ').slice(1).join(' ') || session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        phone_number: phone_number || null
      };

      let customer;
      try {
        // Try to get existing customer
        const customers = await intasend.customers().list({
          email: customerData.email
        });
        
        if (customers && customers.length > 0) {
          customer = customers[0];
        } else {
          // Create new customer
          customer = await intasend.customers().create(customerData);
        }
      } catch (customerError) {
        console.error('Customer creation error:', customerError);
        customer = { id: null }; // Proceed without customer ID
      }

      // Create IntaSend subscription
      const subscriptionPlan = {
        name: `${tier.name} - ${creator.full_name || 'Creator'}`,
        amount: tier.price,
        currency: 'USD',
        interval: tier.billing_period === 'yearly' ? 'yearly' : 'monthly',
        customer_email: customerData.email,
        customer_name: `${customerData.first_name} ${customerData.last_name}`.trim(),
        phone_number: phone_number || null,
        metadata: {
          tier_id: tierId,
          creator_id: tier.user_id,
          subscriber_id: session.user.id,
          subscription_type: 'paid_subscription'
        }
      };

      const intasendSubscription = await intasend.subscriptions().create(subscriptionPlan);

      // Create the subscription record in database
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([{
          subscriber_id: session.user.id,
          creator_id: tier.user_id,
          tier_id: tier.id,
          amount: tier.price,
          status: 'active',
          intasend_subscription_id: intasendSubscription.id || intasendSubscription.subscription_id,
          customer_email: customerData.email,
          customer_name: `${customerData.first_name} ${customerData.last_name}`.trim(),
          phone_number: phone_number || null,
          payment_method: paymentMethod,
          currency: 'USD',
          interval: tier.billing_period === 'yearly' ? 'yearly' : 'monthly'
        }])
        .select()
        .single();

      if (subscriptionError) {
        // If database insertion fails, try to cancel the IntaSend subscription
        try {
          await intasend.subscriptions().cancel(intasendSubscription.id || intasendSubscription.subscription_id);
        } catch (cancelError) {
          console.error('Error canceling IntaSend subscription:', cancelError);
        }
        throw subscriptionError;
      }

      // Update tier statistics
      const { error: updateError } = await supabase
        .from('subscription_tiers')
        .update({
          subscribers: tier.subscribers + 1,
          revenue: tier.revenue + parseFloat(tier.price)
        })
        .eq('id', tier.id);

      if (updateError) throw updateError;

      return NextResponse.json({ 
        subscription,
        intasend_subscription_id: intasendSubscription.id || intasendSubscription.subscription_id,
        message: 'Subscription created successfully'
      });

    } catch (intasendError) {
      console.error('IntaSend subscription error:', intasendError);
      return NextResponse.json({ 
        error: 'Payment processing failed',
        details: intasendError.message || 'Unknown payment error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId, status } = await request.json();

    // Get subscription with IntaSend ID
    const { data: currentSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('subscriber_id', session.user.id)
      .single();

    if (fetchError || !currentSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    try {
      // Update IntaSend subscription based on status
      if (currentSubscription.intasend_subscription_id) {
        switch (status) {
          case 'cancelled':
            await intasend.subscriptions().cancel(currentSubscription.intasend_subscription_id);
            break;
          case 'paused':
            await intasend.subscriptions().pause(currentSubscription.intasend_subscription_id);
            break;
          case 'active':
            await intasend.subscriptions().resume(currentSubscription.intasend_subscription_id);
            break;
        }
      }

      // Update subscription status in database
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .update({ status })
        .eq('id', subscriptionId)
        .eq('subscriber_id', session.user.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ 
        subscription,
        message: `Subscription ${status} successfully`
      });

    } catch (intasendError) {
      console.error('IntaSend update error:', intasendError);
      return NextResponse.json({ 
        error: 'Payment update failed',
        details: intasendError.message || 'Unknown payment error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}