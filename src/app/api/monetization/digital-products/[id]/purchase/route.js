import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import IntaSend from 'intasend-node';

// Initialize IntaSend with environment variables
const intasend = new IntaSend(
  process.env.INTASEND_PUBLISHABLE_KEY || 'ISPubKey_live_8e8857a5-54ad-4d06-8537-4557857db13b',
  process.env.INTASEND_SECRET_KEY || 'ISSecretKey_live_ce648358-1847-471d-bf9f-24cf3f887c59',
  process.env.NODE_ENV === 'production' ? false : true // true for test environment
);

// POST /api/monetization/digital-products/[id]/purchase
export async function POST(req, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { 
      payment_method = 'card', 
      phone_number,
      customer_name,
      customer_email 
    } = await req.json();

    // Get the product details
    const { data: product, error: productError } = await supabase
      .from('digital_products')
      .select('*')
      .eq('id', id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.status !== 'published') {
      return NextResponse.json({ error: 'Product is not available for purchase' }, { status: 400 });
    }

    // Get creator information
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', product.user_id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Calculate commission (80% to creator, 20% to platform)
    const commission = product.price * 0.8;
    const platformFee = product.price * 0.2;

    try {
      // Prepare payment data for IntaSend
      const paymentData = {
        amount: product.price,
        currency: 'USD',
        email: customer_email || session.user.email,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases?status=success&product=${id}`,
        api_ref: `product_purchase_${id}_${session.user.id}_${Date.now()}`,
        metadata: {
          product_id: id,
          product_name: product.name,
          buyer_id: session.user.id,
          creator_id: product.user_id,
          purchase_type: 'digital_product'
        }
      };

      let paymentResponse;

      if (payment_method === 'mpesa' && phone_number) {
        // Process M-Pesa payment
        paymentResponse = await intasend.mpesa().stkPush({
          phone_number: phone_number,
          amount: product.price,
          currency: 'KES', // M-Pesa only supports KES
          api_ref: paymentData.api_ref
        });
      } else {
        // Process card/bank payment via checkout
        paymentResponse = await intasend.collection().charge(paymentData);
      }

      // Create purchase record with pending status
      const { data: purchase, error: purchaseError } = await supabase
        .from('digital_product_purchases')
        .insert([{
          product_id: id,
          user_id: session.user.id,
          amount: product.price,
          commission: commission,
          platform_fee: platformFee,
          status: 'pending',
          payment_method,
          payment_provider: 'intasend',
          intasend_payment_id: paymentResponse.id || paymentResponse.checkout_id,
          payment_reference: paymentData.api_ref,
          customer_name: customer_name || session.user.user_metadata?.full_name,
          customer_email: customer_email || session.user.email,
          phone_number: phone_number || null
        }])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Return appropriate response based on payment method
      if (payment_method === 'mpesa') {
        return NextResponse.json({
          success: true,
          payment_method: 'mpesa',
          message: 'M-Pesa payment initiated. Check your phone for STK push prompt.',
          checkout_id: paymentResponse.checkout_id || paymentResponse.id,
          purchase_id: purchase.id,
          amount: product.price
        });
      } else {
        return NextResponse.json({
          success: true,
          payment_method: 'checkout',
          checkout_url: paymentResponse.url,
          checkout_id: paymentResponse.checkout_id || paymentResponse.id,
          purchase_id: purchase.id,
          amount: product.price,
          message: 'Payment checkout created successfully'
        });
      }

    } catch (intasendError) {
      console.error('IntaSend payment error:', intasendError);
      return NextResponse.json({
        error: 'Payment processing failed',
        details: intasendError.message || 'Unknown payment error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing purchase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/monetization/digital-products/[id]/purchase - Get purchase status and download link
export async function GET(req, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const purchaseId = searchParams.get('purchase_id');

    // Get the purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('digital_product_purchases')
      .select(`
        *,
        digital_products (
          name,
          file_url,
          user_id
        )
      `)
      .eq('product_id', id)
      .eq('user_id', session.user.id)
      .eq('id', purchaseId)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // If purchase is completed, provide download URL
    if (purchase.status === 'completed') {
      // Get download URL
      const { data: { signedUrl }, error: urlError } = await supabase
        .storage
        .from('digital-products')
        .createSignedUrl(purchase.digital_products.file_url, 3600); // 1 hour expiry

      if (urlError) {
        console.error('Error creating signed URL:', urlError);
        return NextResponse.json({
          purchase,
          download_url: null,
          message: 'Purchase completed but download temporarily unavailable'
        });
      }

      return NextResponse.json({
        purchase: {
          ...purchase,
          download_url: signedUrl
        }
      });
    }

    // Return purchase status for pending/failed purchases
    return NextResponse.json({
      purchase,
      message: purchase.status === 'pending' 
        ? 'Payment is being processed' 
        : 'Payment failed or was cancelled'
    });

  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}