import { NextResponse } from 'next/server';
import { checkAuth, getSupabaseClient } from '@/lib/auth-utils';
import { convertToCSV, formatDate, formatCurrency } from '@/lib/export-utils';

export async function GET(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for date range
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query for payouts
    let query = supabase
      .from('payouts')
      .select('*')
      .eq('user_id', session.user.id);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Order by created_at in descending order
    query = query.order('created_at', { ascending: false });

    const { data: payouts, error: payoutsError } = await query;

    if (payoutsError) throw payoutsError;

    // Define CSV headers and field mapping
    const headers = [
      'Payout ID',
      'Amount',
      'Status',
      'Payout Method',
      'Created Date',
      'Completed Date'
    ];

    const fieldMap = {
      'Payout ID': 'id',
      'Amount': 'amount',
      'Status': 'status',
      'Payout Method': 'payout_method',
      'Created Date': 'created_at',
      'Completed Date': 'completed_at'
    };

    // Format the data
    const formattedPayouts = payouts.map(payout => ({
      ...payout,
      amount: formatCurrency(payout.amount),
      created_at: formatDate(new Date(payout.created_at)),
      completed_at: payout.completed_at ? formatDate(new Date(payout.completed_at)) : ''
    }));

    // Convert to CSV
    const csv = convertToCSV(formattedPayouts, headers, fieldMap);

    // Create the response with appropriate headers
    const response = new NextResponse(csv);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="payouts_${formatDate(new Date())}.csv"`
    );

    return response;
  } catch (error) {
    console.error('Error exporting payouts:', error);
    return NextResponse.json(
      { error: 'Failed to export payouts' },
      { status: 500 }
    );
  }
} 