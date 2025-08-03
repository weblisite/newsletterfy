import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Mock user for development when auth is disabled
const getMockUser = () => ({
  id: '00000000-0000-0000-0000-000000000001',
  email: 'user@example.com',
  user_metadata: { name: 'John Doe' }
});

// GET: Fetch cross-promotions for the authenticated user
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    let user;
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      user = getMockUser();
    } else {
      // Get the authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Unauthorized');
      user = authUser;
    }

    // Fetch cross-promotions
    const { data: promotions, error } = await supabase
      .from('cross_promotions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ promotions: promotions || [] });
  } catch (error) {
    console.error('Error fetching cross-promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cross-promotions' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// POST: Create a new cross-promotion
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    let user;
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      user = getMockUser();
    } else {
      // Get the authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Unauthorized');
      user = authUser;
    }

    // Get the promotion data from the request
    const promotionData = await req.json();

    // Check available funds (simplified for development)
    const hasEnoughFunds = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' || 
      parseFloat(promotionData.totalBudget) <= 1000; // Mock limit

    if (!hasEnoughFunds) {
      return NextResponse.json(
        { error: 'Insufficient funds for this promotion' },
        { status: 400 }
      );
    }

    // Create the promotion
    const { data: promotion, error } = await supabase
      .from('cross_promotions')
      .insert([
        {
          user_id: user.id,
          title: promotionData.title,
          description: promotionData.description,
          price_per_subscriber: promotionData.pricePerSubscriber,
          daily_budget: promotionData.dailyBudget,
          total_budget: promotionData.totalBudget,
          target_niche: promotionData.targetNiche,
          start_date: promotionData.startDate,
          end_date: promotionData.endDate,
          status: 'active',
          spent: 0,
          subscribers_gained: 0,
          clicks: 0,
          newsletter_name: promotionData.title, // Fallback for compatibility
          subscribers: 1000, // Mock subscriber count
          revenue_per_click: promotionData.pricePerSubscriber,
          revenue: 0
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error('Error creating cross-promotion:', error);
    return NextResponse.json(
      { error: 'Failed to create cross-promotion' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// PUT: Update a cross-promotion's status
export async function PUT(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    let user;
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      user = getMockUser();
    } else {
      // Get the authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Unauthorized');
      user = authUser;
    }

    // Get the update data from the request
    const { id, status } = await req.json();

    // Update the promotion
    const { data: promotion, error } = await supabase
      .from('cross_promotions')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the promotion
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error('Error updating cross-promotion:', error);
    return NextResponse.json(
      { error: 'Failed to update cross-promotion' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// DELETE: Delete a cross-promotion
export async function DELETE(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    let user;
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      user = getMockUser();
    } else {
      // Get the authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Unauthorized');
      user = authUser;
    }

    // Get the promotion ID from the request
    const { id } = await req.json();

    // Delete the promotion
    const { error } = await supabase
      .from('cross_promotions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user owns the promotion

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cross-promotion:', error);
    return NextResponse.json(
      { error: 'Failed to delete cross-promotion' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 