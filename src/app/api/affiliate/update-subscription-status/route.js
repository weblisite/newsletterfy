import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createClientComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription_id, status } = await request.json();

    if (!subscription_id || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: subscription_id, status' 
      }, { status: 400 });
    }

    // Validate status
    if (!['active', 'cancelled', 'suspended'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be: active, cancelled, or suspended' 
      }, { status: 400 });
    }

    // Update all affiliate referrals associated with this subscription
    const { data: updatedReferrals, error: updateError } = await supabase
      .from('affiliate_referrals')
      .update({
        subscription_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscription_id)
      .select();

    if (updateError) {
      console.error('Error updating affiliate referrals:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update affiliate referral status' 
      }, { status: 500 });
    }

    // If subscription is cancelled, update pending commission payments to cancelled
    if (status === 'cancelled') {
      await supabase
        .from('affiliate_commission_payments')
        .update({
          status: 'cancelled',
          notes: 'Subscription cancelled'
        })
        .eq('subscription_id', subscription_id)
        .eq('status', 'pending');
    }

    // If subscription is reactivated, we don't automatically recreate payments
    // The monthly commission calculation function will handle creating new payments

    return NextResponse.json({
      success: true,
      updated_referrals: updatedReferrals?.length || 0,
      message: `Affiliate referral status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating subscription status:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = createClientComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subscription_id = searchParams.get('subscription_id');

    if (!subscription_id) {
      return NextResponse.json({ 
        error: 'Missing subscription_id parameter' 
      }, { status: 400 });
    }

    // Get affiliate referrals for this subscription
    const { data: referrals, error: referralsError } = await supabase
      .from('affiliate_referrals')
      .select(`
        id,
        user_id,
        subscription_status,
        monthly_commission,
        total_commission_paid,
        is_recurring,
        last_commission_date
      `)
      .eq('subscription_id', subscription_id);

    if (referralsError) {
      console.error('Error fetching affiliate referrals:', referralsError);
      return NextResponse.json({ 
        error: 'Failed to fetch affiliate referrals' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      referrals: referrals || []
    });

  } catch (error) {
    console.error('Error fetching subscription referrals:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 