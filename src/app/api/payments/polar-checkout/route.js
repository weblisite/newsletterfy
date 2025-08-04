import { NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Initialize Polar API client
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: 'production' // Use production since our token appears to be production
});

// Initialize Supabase service role client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
      const { data: user, error: userError } = await supabaseAdmin
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
    const checkoutResponse = await polar.checkouts.create({
      products: [productId],
      successUrl: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard?welcome=true&subscription=success`,
      customerEmail: customer_email,
      customerName: customer_name,
      metadata: {
        ...metadata,
        ...(session?.user?.id && { user_id: session.user.id }),
        customer_email: customer_email,
        customer_name: customer_name,
        plan_type,
        subscriber_tier: subscriber_tier?.toString(),
        source: 'newsletterfy_landing'
      }
    });

    // Store pending platform subscription in database
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('platform_subscriptions')
      .insert([{
        user_id: session?.user?.id || null,
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
  // Actual Polar product IDs from our created products
  const POLAR_PRODUCTS = {
    'Pro': {
      1000: "561bb871-146c-4552-8eff-661fb7d8e337",    // Pro 1K - $29/mo
      5000: "cdebf919-ef1b-4d7c-8388-8798c6a5bb71",    // Pro 5K - $49/mo
      10000: "1cf27351-6eb8-43a1-8103-caf4786c647c",   // Pro 10K - $69/mo
      25000: "2e91dbea-3c1a-4706-93cd-9b5a5133fd82",   // Pro 25K - $119/mo
      50000: "d7951e00-0538-4098-a560-5844d37df035",   // Pro 50K - $149/mo
      75000: "670efd8b-fc0d-4932-b23d-a0fc3db46896",   // Pro 75K - $199/mo
      100000: "2fe4c45b-8fa6-4283-83da-8e3c8fa787b5",  // Pro 100K - $249/mo
    },
    'Business': {
      1000: "290a8b0d-44cb-4edb-88b5-dbea483c8664",    // Business 1K - $89/mo
      5000: "de5ea4bc-470d-4383-972f-ae0f1bf1b1c6",    // Business 5K - $129/mo
      10000: "34ee840a-ac5d-42cd-9b02-78bb05501a9f",   // Business 10K - $149/mo
      25000: "484650d9-273a-4743-a6c3-9a4b0ffa22eb",   // Business 25K - $199/mo
      50000: "6f2a4e26-a1d0-4fea-89dd-ba812270b4e1",   // Business 50K - $249/mo
      75000: "55e78601-7479-42d5-bc52-e7effe5bd92b",   // Business 75K - $279/mo
      100000: "a30b5754-b298-4f80-94f8-aee0f4062337",  // Business 100K - $299/mo
    },
    // Enterprise plan removed - users contact sales via Calendly
  };

  return POLAR_PRODUCTS[planType]?.[subscriberTier];
}