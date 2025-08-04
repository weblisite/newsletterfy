import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/user/purchases/digital-products/[id]/download - Get secure download link
export async function POST(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: purchaseId } = params;

    // Verify purchase ownership and completion
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('digital_product_purchases')
      .select(`
        *,
        digital_products (
          name,
          type,
          file_url,
          user_id
        ),
        digital_product_deliveries (
          access_expires_at
        )
      `)
      .eq('id', purchaseId)
      .eq('buyer_id', session.user.id)
      .eq('status', 'completed')
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ 
        error: 'Purchase not found or not completed' 
      }, { status: 404 });
    }

    // Check if access has expired
    const delivery = purchase.digital_product_deliveries?.[0];
    if (delivery?.access_expires_at) {
      const expiryDate = new Date(delivery.access_expires_at);
      if (new Date() > expiryDate) {
        return NextResponse.json({ 
          error: 'Download access has expired' 
        }, { status: 403 });
      }
    }

    const product = purchase.digital_products;
    if (!product?.file_url) {
      return NextResponse.json({ 
        error: 'Product file not available' 
      }, { status: 404 });
    }

    // Generate secure download URL
    // For Supabase Storage, create a signed URL
    let downloadUrl = product.file_url;
    let filename = `${product.name}.${getFileExtension(product.type)}`;

    // If using Supabase Storage, generate signed URL
    if (product.file_url.includes('supabase')) {
      try {
        // Extract bucket and path from URL
        const url = new URL(product.file_url);
        const pathParts = url.pathname.split('/');
        const bucket = pathParts[3]; // /storage/v1/object/public/[bucket]
        const filePath = pathParts.slice(5).join('/'); // everything after bucket

        if (bucket && filePath) {
          const { data: signedUrl, error: signError } = await supabaseAdmin.storage
            .from(bucket)
            .createSignedUrl(filePath, 3600); // 1 hour expiry

          if (!signError && signedUrl) {
            downloadUrl = signedUrl.signedUrl;
          }
        }
      } catch (urlError) {
        console.error('Error generating signed URL:', urlError);
        // Fallback to original URL
      }
    }

    // Log the download
    await supabaseAdmin
      .from('digital_product_deliveries')
      .upsert({
        purchase_id: purchase.id,
        delivery_method: 'download',
        delivered_at: new Date().toISOString(),
        download_url: downloadUrl,
        access_expires_at: delivery?.access_expires_at || null,
      }, {
        onConflict: 'purchase_id'
      });

    return NextResponse.json({
      success: true,
      download_url: downloadUrl,
      filename: filename,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
    });

  } catch (error) {
    console.error('Error generating download link:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function getFileExtension(productType) {
  switch (productType) {
    case 'ebook':
      return 'pdf';
    case 'course':
      return 'zip';
    case 'template':
      return 'zip';
    case 'resource':
      return 'zip';
    default:
      return 'zip';
  }
}