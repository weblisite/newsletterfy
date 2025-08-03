import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Mock data for development
const MOCK_PAYOUTS = Array(50).fill(null).map((_, index) => ({
  id: `payout_${index + 1}`,
  user_id: `user_${Math.floor(Math.random() * 1000)}`,
  amount: Math.floor(Math.random() * 10000) / 100,
  status: ['pending', 'processing', 'completed', 'failed'][Math.floor(Math.random() * 4)],
  payout_method: ['bank_transfer', 'mpesa', 'intasend', 'crypto'][Math.floor(Math.random() * 4)],
  created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
  processed_at: null,
  reference: `REF${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
}));

export async function GET(request) {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

  if (isDevelopment) {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const status = searchParams.get('status');
    const method = searchParams.get('method');

    // Filter mock data based on query parameters
    let filteredPayouts = [...MOCK_PAYOUTS];
    if (status) {
      filteredPayouts = filteredPayouts.filter(p => p.status === status);
    }
    if (method) {
      filteredPayouts = filteredPayouts.filter(p => p.payout_method === method);
    }

    // Calculate pagination
    const start = (page - 1) * limit;
    const paginatedPayouts = filteredPayouts.slice(start, start + limit);

    // Return mock data
    return NextResponse.json({
      payouts: paginatedPayouts,
      total: filteredPayouts.length,
      page,
      limit,
      total_pages: Math.ceil(filteredPayouts.length / limit)
    });
  }

  // Production mode - implement actual authentication and database queries
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get session
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const status = searchParams.get('status');
    const method = searchParams.get('method');

    // Build query
    let query = supabase
      .from('payouts')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (method) {
      query = query.eq('payout_method', method);
    }

    // Apply pagination
    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);

    // Execute query
    const { data: payouts, count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      payouts,
      total: count,
      page,
      limit,
      total_pages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

  if (isDevelopment) {
    const data = await request.json();
    return NextResponse.json({
      id: `payout_${Date.now()}`,
      ...data,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const data = await request.json();
    const { data: payout, error } = await supabase
      .from('payouts')
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(payout);
  } catch (error) {
    console.error('Error creating payout:', error);
    return NextResponse.json(
      { error: 'Failed to create payout' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

  if (isDevelopment) {
    const data = await request.json();
    return NextResponse.json({
      ...data,
      updated_at: new Date().toISOString(),
    });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const data = await request.json();
    const { id, ...updateData } = data;

    const { data: payout, error } = await supabase
      .from('payouts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(payout);
  } catch (error) {
    console.error('Error updating payout:', error);
    return NextResponse.json(
      { error: 'Failed to update payout' },
      { status: 500 }
    );
  }
} 