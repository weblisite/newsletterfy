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

// GET billing information
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch billing information
    const [subscriptionData, paymentMethodData, paymentHistoryData] = await Promise.all([
      // Get current subscription
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      
      // Get saved payment methods
      supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id),
      
      // Get payment history
      supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ]);

    return NextResponse.json({
      subscription: subscriptionData.data,
      paymentMethods: paymentMethodData.data,
      paymentHistory: paymentHistoryData.data
    });
  } catch (error) {
    console.error('Admin billing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Update subscription
export async function PUT(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    try {
      // Create or update IntaSend subscription
      let intasendSubscription;
      
      if (updates.plan && updates.priceId) {
        // Create new subscription with IntaSend
        const subscriptionPlan = {
          name: `${updates.plan} Plan - Admin Subscription`,
          amount: getPlanAmount(updates.plan),
          currency: 'USD',
          interval: 'monthly',
          customer_email: userData.email,
          customer_name: userData.full_name || 'Admin User',
          metadata: {
            plan: updates.plan,
            user_id: user.id,
            user_type: 'admin',
            subscription_type: 'platform'
          }
        };

        intasendSubscription = await intasend.subscriptions().create(subscriptionPlan);
      }

      // Update subscription in database
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          intasend_subscription_id: intasendSubscription?.id || intasendSubscription?.subscription_id,
          plan: updates.plan,
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          amount: getPlanAmount(updates.plan),
          currency: 'USD',
          interval: 'monthly',
          customer_email: userData.email,
          customer_name: userData.full_name || 'Admin User'
        })
        .select()
        .single();

      if (subscriptionError) {
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }

      return NextResponse.json(subscription);
    } catch (intasendError) {
      console.error('IntaSend subscription error:', intasendError);
      return NextResponse.json({ 
        error: 'Payment processing failed',
        details: intasendError.message || 'Unknown payment error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Admin billing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Add payment method
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentMethod } = await request.json();

    // Add payment method to database (IntaSend handles payment methods differently)
    const { data: paymentMethodRecord, error: paymentMethodError } = await supabase
      .from('payment_methods')
      .insert({
        user_id: user.id,
        payment_method_type: 'card',
        card_last_four: paymentMethod.cardNumber?.slice(-4) || '****',
        card_brand: getCardBrand(paymentMethod.cardNumber),
        cardholder_name: paymentMethod.cardholderName,
        is_default: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentMethodError) {
      return NextResponse.json({ error: 'Failed to add payment method' }, { status: 500 });
    }

    return NextResponse.json(paymentMethodRecord);
  } catch (error) {
    console.error('Admin billing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper function to get plan amounts
function getPlanAmount(plan) {
  const planPrices = {
    'Basic': 29,
    'Pro': 79,
    'Enterprise': 199
  };
  return planPrices[plan] || 29;
}

// Helper function to detect card brand
function getCardBrand(cardNumber) {
  if (!cardNumber) return 'unknown';
  
  const number = cardNumber.replace(/\s/g, '');
  
  if (number.startsWith('4')) return 'visa';
  if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
  if (number.startsWith('3')) return 'amex';
  if (number.startsWith('6')) return 'discover';
  
  return 'unknown';
}