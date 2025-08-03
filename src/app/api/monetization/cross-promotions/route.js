import { NextResponse } from 'next/server';
import { checkAuth, getSupabaseClient } from '@/lib/auth-utils';

// Get all cross promotions for the authenticated user
export async function GET(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('cross_promotions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching cross promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cross promotions' },
      { status: 500 }
    );
  }
}

// Create a new cross promotion
export async function POST(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { newsletter_name, description, subscribers, revenue_per_click, start_date, end_date, status } = body;

    const { data, error } = await supabase
      .from('cross_promotions')
      .insert([
        {
          user_id: session.user.id,
          newsletter_name,
          description,
          subscribers,
          revenue_per_click,
          start_date,
          end_date,
          status,
          clicks: 0,
          revenue: 0
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating cross promotion:', error);
    return NextResponse.json(
      { error: 'Failed to create cross promotion' },
      { status: 500 }
    );
  }
}

// Update a cross promotion
export async function PATCH(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    // Remove computed fields if they exist
    delete updateData.clicks;
    delete updateData.revenue;

    const { data, error } = await supabase
      .from('cross_promotions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating cross promotion:', error);
    return NextResponse.json(
      { error: 'Failed to update cross promotion' },
      { status: 500 }
    );
  }
}

// Delete a cross promotion
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
        { error: 'Promotion ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('cross_promotions')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Cross promotion deleted successfully' });
  } catch (error) {
    console.error('Error deleting cross promotion:', error);
    return NextResponse.json(
      { error: 'Failed to delete cross promotion' },
      { status: 500 }
    );
  }
} 