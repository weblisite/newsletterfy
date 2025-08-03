import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Get all subscription tiers for the authenticated user
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tiers, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tiers });
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Create a new subscription tier
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, price, description, features, status, billingPeriod } = await request.json();

    const { data: tier, error } = await supabase
      .from('subscription_tiers')
      .insert([{
        user_id: session.user.id,
        name,
        price,
        description,
        features,
        status,
        billing_period: billingPeriod,
        subscribers: 0,
        revenue: 0
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ tier });
  } catch (error) {
    console.error('Error creating subscription tier:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Update a subscription tier
export async function PATCH(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await request.json();

    const { data: tier, error } = await supabase
      .from('subscription_tiers')
      .update({ status })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ tier });
  } catch (error) {
    console.error('Error updating subscription tier:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Delete a subscription tier
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

    // Check if tier has subscribers
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('subscribers')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (tierError) throw tierError;

    if (tier.subscribers > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tier with active subscribers' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('subscription_tiers')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Subscription tier deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription tier:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription tier' },
      { status: 500 }
    );
  }
} 