import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch platform plans
    const { data: plans, error: plansError } = await supabase
      .from('platform_subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (plansError) {
      console.error('Error fetching plans:', plansError);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    // Fetch plan tiers
    const { data: tiers, error: tiersError } = await supabase
      .from('platform_plan_tiers')
      .select('*')
      .order('subscriber_limit');

    if (tiersError) {
      console.error('Error fetching tiers:', tiersError);
      return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 });
    }

    // Group tiers by plan name
    const tiersByPlan = tiers?.reduce((acc, tier) => {
      if (!acc[tier.plan_name]) acc[tier.plan_name] = [];
      acc[tier.plan_name].push(tier);
      return acc;
    }, {}) || {};

    return NextResponse.json({ 
      plans: plans || [],
      tiers: tiersByPlan,
      success: true 
    });
  } catch (error) {
    console.error('Error in platform plans API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 