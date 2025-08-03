import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: segments, error } = await supabase
      .from('subscriber_segments')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at');

    if (error) {
      console.error('Error fetching segments:', error);
      return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 });
    }

    return NextResponse.json({ 
      segments: segments || [],
      success: true 
    });
  } catch (error) {
    console.error('Error in subscriber segments API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, segment_type, criteria } = body;

    const { data: segment, error } = await supabase
      .from('subscriber_segments')
      .insert({
        user_id: session.user.id,
        name,
        description,
        segment_type,
        criteria: criteria || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating segment:', error);
      return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 });
    }

    return NextResponse.json({ 
      segment,
      success: true 
    });
  } catch (error) {
    console.error('Error in subscriber segments POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 