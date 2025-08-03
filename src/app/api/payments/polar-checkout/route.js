import { NextResponse } from 'next/server';
import { PolarApi, Configuration } from '@polar-sh/sdk';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Initialize Polar API client
const polar = new PolarApi(
  new Configuration({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    basePath: process.env.NODE_ENV === 'production' 
      ? 'https://api.polar.sh' 
      : 'https://sandbox-api.polar.sh'
  })
);

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    const {
      plan_type,      // 'Free', 'Pro', 'Business', 'Enterprise'
      subscriber_tier, // subscriber count tier
      customer_email,
      customer_name,
      success_url,
      cancel_url,
      metadata = {}
    } = await request.json();

    // Validate required fields
    if (!plan_type || !customer_email || !customer_name) {
      return NextResponse.json({
        error: 'Missing required fields: plan_type, customer_email, customer_name'
      }, { status: 400 });
    }

    // Handle Free plan - no payment needed
    if (plan_type === 'Free') {
      // Create user directly in database for free plan
      const { data: user, error: userError } = await supabase
        .from('users')
        .upsert({
          id: session?.user?.id,
          email: customer_email,
          full_name: customer_name,
          plan_type: 'Free',
          subscriber_limit: 1000,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

      if (userError) throw userError;

      return NextResponse.json({
        success: true,
        plan_type: 'Free',
        message: 'Free plan activated successfully',
        redirect_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard?welcome=true`
      });
    }

    // Get the appropriate Polar product ID based on plan and tier
    const productId = getPolarProductId(plan_type, subscriber_tier);
    
    if (!productId) {
      return NextResponse.json({
        error: `No product found for plan: ${plan_type} with ${subscriber_tier} subscribers`
      }, { status: 400 });
    }

    // Create Polar checkout session
    const checkoutResponse = await polar.checkouts.checkoutsCreate({
      productId: productId,
      successUrl: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
      cancelUrl: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/`,
      customerEmail: customer_email,
      customerName: customer_name,
      metadata: {
        ...metadata,
        user_id: session?.user?.id,
        customer_email: customer_email,
        customer_name: customer_name,
        plan_type,
        subscriber_tier: subscriber_tier?.toString(),
        source: 'newsletterfy_landing'
      }
    });

    // Store pending platform subscription in database
    const { data: subscription, error: subscriptionError } = await supabase
      .from('platform_subscriptions')
      .insert([{
        user_id: session?.user?.id,
        plan_type,
        subscriber_limit: subscriber_tier,
        status: 'pending',
        payment_status: 'incomplete',
        customer_name,
        customer_email,
        amount: 0, // Will be updated by webhook
        currency: 'USD',
        payment_provider: 'polar',
        polar_checkout_id: checkoutResponse.id,
        created_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (subscriptionError) {
      console.error('Database error:', subscriptionError);
      // Continue anyway - webhook will handle record creation
    }

    return NextResponse.json({
      success: true,
      checkout_url: checkoutResponse.url,
      checkout_id: checkoutResponse.id,
      plan_type,
      subscriber_tier,
      message: 'Checkout session created successfully'
    });

  } catch (error) {
    console.error('Polar checkout error:', error);
    return NextResponse.json({
      error: 'Payment service error',
      details: error.message || 'Failed to create checkout session'
    }, { status: 500 });
  }
}

// Helper function to map your pricing plans to Polar product IDs
function getPolarProductId(planType, subscriberTier) {
  // You'll need to replace these with actual Polar product IDs
  const POLAR_PRODUCTS = {
    'Pro': {
      1000: process.env.POLAR_PRO_1K_PRODUCT_ID,
      5000: process.env.POLAR_PRO_5K_PRODUCT_ID,
      10000: process.env.POLAR_PRO_10K_PRODUCT_ID,
      25000: process.env.POLAR_PRO_25K_PRODUCT_ID,
      50000: process.env.POLAR_PRO_50K_PRODUCT_ID,
      75000: process.env.POLAR_PRO_75K_PRODUCT_ID,
      100000: process.env.POLAR_PRO_100K_PRODUCT_ID,
    },
    'Business': {
      1000: process.env.POLAR_BUSINESS_1K_PRODUCT_ID,
      5000: process.env.POLAR_BUSINESS_5K_PRODUCT_ID,
      10000: process.env.POLAR_BUSINESS_10K_PRODUCT_ID,
      25000: process.env.POLAR_BUSINESS_25K_PRODUCT_ID,
      50000: process.env.POLAR_BUSINESS_50K_PRODUCT_ID,
      75000: process.env.POLAR_BUSINESS_75K_PRODUCT_ID,
      100000: process.env.POLAR_BUSINESS_100K_PRODUCT_ID,
    },
    // Enterprise plan removed - users contact sales via Calendly
  };

  return POLAR_PRODUCTS[planType]?.[subscriberTier] || POLAR_PRODUCTS[planType]?.['custom'];
}