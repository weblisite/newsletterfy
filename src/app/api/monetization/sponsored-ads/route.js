import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Get all sponsored ads for the authenticated user
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('sponsored_ads')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching sponsored ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsored ads' },
      { status: 500 }
    );
  }
}

// Create a new sponsored ad
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { brand_name, campaign, budget, start_date, end_date, status } = body;

    const { data, error } = await supabase
      .from('sponsored_ads')
      .insert([
        {
          user_id: session.user.id,
          brand_name,
          campaign,
          budget,
          start_date,
          end_date,
          status,
          clicks: 0,
          impressions: 0,
          revenue: 0
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating sponsored ad:', error);
    return NextResponse.json(
      { error: 'Failed to create sponsored ad' },
      { status: 500 }
    );
  }
}

// Update a sponsored ad
export async function PATCH(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    // Remove computed fields if they exist
    delete updateData.clicks;
    delete updateData.impressions;
    delete updateData.revenue;

    const { data, error } = await supabase
      .from('sponsored_ads')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating sponsored ad:', error);
    return NextResponse.json(
      { error: 'Failed to update sponsored ad' },
      { status: 500 }
    );
  }
}

// Delete a sponsored ad
export async function DELETE(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Ad ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('sponsored_ads')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Sponsored ad deleted successfully' });
  } catch (error) {
    console.error('Error deleting sponsored ad:', error);
    return NextResponse.json(
      { error: 'Failed to delete sponsored ad' },
      { status: 500 }
    );
  }
} 