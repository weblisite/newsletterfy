import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/monetization/digital-products
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: products, error } = await supabase
      .from('digital_products')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching digital products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/monetization/digital-products
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productData = await req.json();
    const { name, type, price, description, features, fileUrl, previewUrl, status } = productData;

    const { data: product, error } = await supabase
      .from('digital_products')
      .insert([{
        user_id: session.user.id,
        name,
        type,
        price: parseFloat(price),
        description,
        features,
        file_url: fileUrl,
        preview_url: previewUrl,
        status,
        sales: 0,
        revenue: 0
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error creating digital product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Update a digital product
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
    delete updateData.sales;
    delete updateData.revenue;

    const { data, error } = await supabase
      .from('digital_products')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating digital product:', error);
    return NextResponse.json(
      { error: 'Failed to update digital product' },
      { status: 500 }
    );
  }
}

// Delete a digital product
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
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('digital_products')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Digital product deleted successfully' });
  } catch (error) {
    console.error('Error deleting digital product:', error);
    return NextResponse.json(
      { error: 'Failed to delete digital product' },
      { status: 500 }
    );
  }
} 