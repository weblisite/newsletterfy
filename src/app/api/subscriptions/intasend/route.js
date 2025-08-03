import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import IntaSend from 'intasend-node';

// Initialize IntaSend
const intasend = new IntaSend(
  process.env.INTASEND_PUBLISHABLE_KEY || 'ISPubKey_live_8e8857a5-54ad-4d06-8537-4557857db13b',
  process.env.INTASEND_SECRET_KEY || 'ISSecretKey_live_ce648358-1847-471d-bf9f-24cf3f887c59',
  process.env.NODE_ENV === 'production' ? false : true
);

// Create a subscription plan
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    const { 
      name,
      amount,
      interval, // monthly, yearly
      currency = 'USD',
      description,
      features = []
    } = body;

    if (!name || !amount || !interval) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, amount, interval' 
      }, { status: 400 });
    }

    try {
      // Create subscription plan with IntaSend
      const subscription = intasend.subscription();
      
      const planData = {
        name: name,
        amount: amount,
        currency: currency,
        interval: interval, // 'monthly' or 'yearly'
        description: description || `${name} subscription plan`
      };

      const plan = await subscription.createPlan(planData);

      // Save plan to database
      const { data: savedPlan, error: planError } = await supabase
        .from('subscription_plans')
        .insert([{
          name,
          amount,
          interval,
          currency,
          description,
          features,
          intasend_plan_id: plan.id,
          provider: 'intasend',
          status: 'active'
        }])
        .select('*')
        .single();

      if (planError) {
        console.error('Error saving plan to database:', planError);
        return NextResponse.json({ 
          error: 'Failed to save subscription plan' 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        plan: savedPlan,
        intasend_plan: plan
      });

    } catch (intasendError) {
      console.error('IntaSend subscription error:', intasendError);
      return NextResponse.json({ 
        error: 'Failed to create subscription plan',
        details: intasendError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error.message 
    }, { status: 500 });
  }
}

// Get subscription plans
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('status', 'active')
      .order('amount', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch subscription plans' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      plans: plans || []
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error.message 
    }, { status: 500 });
  }
} 