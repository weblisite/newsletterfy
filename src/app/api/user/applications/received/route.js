import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET: Fetch applications received for user's promotions
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error('Unauthorized');

    // Get applications where the user is the promotion owner
    const { data: applications, error } = await supabase
      .from('promotion_applications')
      .select('*')
      .eq('promotion_owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching received applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 