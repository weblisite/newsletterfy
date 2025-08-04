import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/user/purchases/digital-products - Get user's digital product purchases
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's digital product purchases with product details
    const { data: purchases, error } = await supabaseAdmin
      .from('digital_product_purchases')
      .select(`
        *,
        digital_products (
          name,
          type,
          description,
          file_url,
          preview_url
        ),
        digital_product_deliveries (
          delivery_method,
          delivered_at,
          download_url,
          access_expires_at
        )
      `)
      .eq('buyer_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
      throw error;
    }

    // Format the response
    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.id,
      product_id: purchase.product_id,
      product_name: purchase.digital_products?.name || 'Unknown Product',
      product_type: purchase.digital_products?.type || 'unknown',
      product_description: purchase.digital_products?.description,
      purchase_price: purchase.purchase_price,
      status: purchase.status,
      created_at: purchase.created_at,
      completed_at: purchase.completed_at,
      payment_provider: purchase.payment_provider || 'polar',
      delivery: purchase.digital_product_deliveries?.[0] || null,
      access_expires_at: purchase.digital_product_deliveries?.[0]?.access_expires_at,
    }));

    return NextResponse.json({
      success: true,
      purchases: formattedPurchases,
      total: formattedPurchases.length
    });

  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}