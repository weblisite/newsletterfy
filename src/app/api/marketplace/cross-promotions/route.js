import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Mock user for development when auth is disabled
const getMockUser = () => ({
  id: '00000000-0000-0000-0000-000000000001',
  email: 'user@example.com',
  user_metadata: { name: 'John Doe' }
});

// GET: Fetch available cross-promotions for the marketplace
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const niche = searchParams.get('niche');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');

    // Build the query - get all active promotions except user's own
    let query = supabase
      .from('cross_promotions')
      .select('*')
      .eq('status', 'active')
      .neq('user_id', user.id); // Don't show user's own promotions

    // Apply filters
    if (niche) {
      query = query.eq('target_niche', niche);
    }
    if (minPrice) {
      query = query.gte('price_per_subscriber', minPrice);
    }
    if (maxPrice) {
      query = query.lte('price_per_subscriber', maxPrice);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Execute query
    const { data: promotions, error } = await query
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to include newsletter details (mock for development)
    const transformedPromotions = (promotions || []).map(promotion => ({
      ...promotion,
      newsletter_name: promotion.title || promotion.newsletter_name,
      newsletter_subscribers: promotion.subscribers || 1000,
      open_rate: promotion.open_rate || 65.5
    }));

    return NextResponse.json({ promotions: transformedPromotions });
  } catch (error) {
    console.error('Error fetching marketplace promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// POST: Apply for a cross-promotion
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

    // Get the promotion ID from the request
    const { promotionId } = await req.json();

    // Get the promotion details
    const { data: promotion, error: promotionError } = await supabase
      .from('cross_promotions')
      .select('*')
      .eq('id', promotionId)
      .single();

    if (promotionError) throw promotionError;
    if (!promotion) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }

    // For development, simulate application creation (since promotion_applications table might not exist yet)
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      return NextResponse.json({ 
        success: true,
        message: 'Application submitted successfully (development mode)',
        application: {
          id: 'mock-application-id',
          promotion_id: promotionId,
          applicant_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      });
    }

    // Check if user has already applied (when not in dev mode)
    const { data: existingApplication, error: applicationError } = await supabase
      .from('promotion_applications')
      .select('*')
      .eq('promotion_id', promotionId)
      .eq('applicant_id', user.id)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this promotion' },
        { status: 400 }
      );
    }

    // Create the application
    const { data: application, error } = await supabase
      .from('promotion_applications')
      .insert([
        {
          promotion_id: promotionId,
          applicant_id: user.id,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: 'Application submitted successfully',
      application 
    });
  } catch (error) {
    console.error('Error applying for promotion:', error);
    return NextResponse.json(
      { error: 'Failed to apply for promotion' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 