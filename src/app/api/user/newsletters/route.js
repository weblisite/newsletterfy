import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Mock user for development when auth is disabled
const getMockUser = () => ({
  id: '00000000-0000-0000-0000-000000000001',
  email: 'user@example.com',
  user_metadata: { name: 'John Doe' }
});

// GET: Fetch user's newsletters
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    let user;
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      user = getMockUser();
    } else {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Unauthorized');
      user = authUser;
    }

    // Fetch user's newsletters
    const { data: newsletters, error } = await supabase
      .from('newsletters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ newsletters: newsletters || [] });
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// POST: Create a new newsletter
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    let user;
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      user = getMockUser();
    } else {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Unauthorized');
      user = authUser;
    }

    const newsletterData = await req.json();

    // Validate required fields
    if (!newsletterData.newsletter_name) {
      return NextResponse.json(
        { error: 'Newsletter name is required' },
        { status: 400 }
      );
    }

    // Create the newsletter
    const { data: newsletter, error } = await supabase
      .from('newsletters')
      .insert([
        {
          user_id: user.id,
          newsletter_name: newsletterData.newsletter_name,
          description: newsletterData.description,
          subscriber_count: newsletterData.subscriber_count || 0,
          open_rate: newsletterData.open_rate || 0,
          click_rate: newsletterData.click_rate || 0,
          niche: newsletterData.niche,
          website_url: newsletterData.website_url,
          subscription_url: newsletterData.subscription_url,
          status: 'active'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ newsletter });
  } catch (error) {
    console.error('Error creating newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to create newsletter' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// PUT: Update a newsletter
export async function PUT(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    let user;
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      user = getMockUser();
    } else {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Unauthorized');
      user = authUser;
    }

    const { id, ...updateData } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Newsletter ID is required' },
        { status: 400 }
      );
    }

    // Update the newsletter
    const { data: newsletter, error } = await supabase
      .from('newsletters')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the newsletter
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ newsletter });
  } catch (error) {
    console.error('Error updating newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to update newsletter' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// DELETE: Delete a newsletter
export async function DELETE(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    let user;
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      user = getMockUser();
    } else {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Unauthorized');
      user = authUser;
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Newsletter ID is required' },
        { status: 400 }
      );
    }

    // Delete the newsletter
    const { error } = await supabase
      .from('newsletters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user owns the newsletter

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to delete newsletter' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 