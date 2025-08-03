import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/monetization/donation-tiers
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tiers, error } = await supabase
      .from('donation_tiers')
      .select('*')
      .eq('user_id', session.user.id)
      .order('amount', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tiers });
  } catch (error) {
    console.error('Error fetching donation tiers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/monetization/donation-tiers
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, amount, description, perks = [], status = 'active' } = body;

    if (!name || !amount) {
      return NextResponse.json({ error: 'Name and amount are required' }, { status: 400 });
    }

    const { data: tier, error } = await supabase
      .from('donation_tiers')
      .insert([{
        user_id: session.user.id,
        name,
        amount,
        description,
        perks,
        status
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ tier });
  } catch (error) {
    console.error('Error creating donation tier:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/monetization/donation-tiers
export async function PATCH(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 });
    }

    const { data: tier, error } = await supabase
      .from('donation_tiers')
      .update(updates)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ tier });
  } catch (error) {
    console.error('Error updating donation tier:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Delete a donation tier
export async function DELETE(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Tier ID is required' },
        { status: 400 }
      );
    }

    // Check if tier has any donations
    const { count, error: countError } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .eq('tier_id', id);

    if (countError) throw countError;

    if (count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tier with existing donations' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('donation_tiers')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Donation tier deleted successfully' });
  } catch (error) {
    console.error('Error deleting donation tier:', error);
    return NextResponse.json(
      { error: 'Failed to delete donation tier' },
      { status: 500 }
    );
  }
} 