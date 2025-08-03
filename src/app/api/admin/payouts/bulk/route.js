import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';
import { getSupabaseClient } from '@/lib/auth-utils';
import { sendPayoutStatusEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const { isAdmin, error: authError } = await checkAdminAuth();

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { action, payout_ids } = await req.json();

    if (!action || !payout_ids || !Array.isArray(payout_ids) || payout_ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    let updates = {};
    switch (action) {
      case 'approve':
        updates = { status: 'approved', approved_at: now };
        break;
      case 'reject':
        updates = { status: 'rejected', rejected_at: now };
        break;
      case 'process':
        updates = { status: 'processing', processing_started_at: now };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update payouts
    const { data: updatedPayouts, error: updateError } = await supabase
      .from('payouts')
      .update(updates)
      .in('id', payout_ids)
      .select('*, users!inner(email)');

    if (updateError) {
      throw updateError;
    }

    // Send email notifications
    await Promise.all(
      updatedPayouts.map(payout => 
        sendPayoutStatusEmail({
          email: payout.users.email,
          status: updates.status,
          amount: payout.amount,
          payoutId: payout.id
        })
      )
    );

    return NextResponse.json({
      message: `Successfully updated ${updatedPayouts.length} payouts`,
      updated: updatedPayouts
    });
  } catch (error) {
    console.error('Error processing bulk payout action:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk action' },
      { status: 500 }
    );
  }
} 