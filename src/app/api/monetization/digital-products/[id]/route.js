import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/monetization/digital-products/[id]
export async function GET(req, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const { data: product, error } = await supabase
      .from('digital_products')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error) throw error;
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching digital product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/monetization/digital-products/[id]
export async function PATCH(req, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const updates = await req.json();

    // Ensure the product belongs to the user
    const { data: existingProduct, error: fetchError } = await supabase
      .from('digital_products')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update the product
    const { error: updateError } = await supabase
      .from('digital_products')
      .update(updates)
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating digital product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/monetization/digital-products/[id]
export async function DELETE(req, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Ensure the product belongs to the user
    const { data: existingProduct, error: fetchError } = await supabase
      .from('digital_products')
      .select('sales')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Don't allow deletion if the product has sales
    if (existingProduct.sales > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with sales history' },
        { status: 400 }
      );
    }

    // Delete the product
    const { error: deleteError } = await supabase
      .from('digital_products')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting digital product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 