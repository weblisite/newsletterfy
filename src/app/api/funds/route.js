import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Get user's funds data
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's balance stats from Supabase
    const { data: balanceStats, error: balanceError } = await supabase
      .from('user_funds')
      .select('balance, pending_balance, total_earned, total_spent')
      .eq('user_id', userId)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      throw balanceError;
    }

    // Get user's transactions from payment_transactions table
    const { data: transactions, error: transactionsError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (transactionsError) {
      throw transactionsError;
    }

    // Return consolidated funds data
    return NextResponse.json({
      balanceStats: balanceStats || {
        balance: 0,
        pending_balance: 0,
        total_earned: 0,
        total_spent: 0
      },
      transactions: transactions || [],
      withdrawalMethods: [], // This would need to be implemented in Supabase
    });
  } catch (error) {
    console.error('Error fetching funds data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funds data' },
      { status: 500 }
    );
  }
} 