import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/marketplace/digital-products - Get published digital products for marketplace
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const type = searchParams.get('type');
    const priceMin = parseFloat(searchParams.get('priceMin'));
    const priceMax = parseFloat(searchParams.get('priceMax'));
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = supabaseAdmin
      .from('digital_products')
      .select(`
        *,
        users!digital_products_user_id_fkey (
          id,
          email,
          full_name
        )
      `, { count: 'exact' })
      .eq('status', 'published');

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    
    if (!isNaN(priceMin)) {
      query = query.gte('price', priceMin);
    }
    
    if (!isNaN(priceMax)) {
      query = query.lte('price', priceMax);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching marketplace products:', error);
      throw error;
    }

    // Format the response
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      type: product.type,
      price: parseFloat(product.price),
      description: product.description,
      features: product.features || [],
      preview_url: product.preview_url,
      status: product.status,
      sales: product.sales || 0,
      revenue: parseFloat(product.revenue || 0),
      created_at: product.created_at,
      creator: {
        id: product.users?.id,
        name: product.users?.full_name || product.users?.email,
        email: product.users?.email
      }
    }));

    const totalPages = Math.ceil(count / limit);

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        type,
        priceMin,
        priceMax,
        search,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Error fetching marketplace products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}