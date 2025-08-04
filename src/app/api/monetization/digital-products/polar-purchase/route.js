import { NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { createClient } from '@supabase/supabase-js';

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: 'production', // Use 'production' for live Polar API
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/monetization/digital-products/polar-purchase
export async function POST(request) {
  try {
    const { product_id, customer_email, customer_name, user_id } = await request.json();

    if (!product_id || !customer_email || !user_id) {
      return NextResponse.json({ error: 'Missing required fields: product_id, customer_email, user_id' }, { status: 400 });
    }

    // Get the digital product details from database
    const { data: product, error: productError } = await supabaseAdmin
      .from('digital_products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.status !== 'published') {
      return NextResponse.json({ error: 'Product is not available for purchase' }, { status: 400 });
    }

    // Check if user already purchased this product
    const { data: existingPurchase } = await supabaseAdmin
      .from('digital_product_purchases')
      .select('id')
      .eq('product_id', product_id)
      .eq('buyer_id', user_id)
      .eq('status', 'completed')
      .single();

    if (existingPurchase) {
      return NextResponse.json({ error: 'You have already purchased this product' }, { status: 400 });
    }

    // Get the appropriate Polar price ID based on product type
    const polarPriceId = getPolarPriceIdForProductType(product.type);
    
    if (!polarPriceId) {
      return NextResponse.json({ 
        error: `No Polar product configured for type: ${product.type}` 
      }, { status: 400 });
    }

    // Create Polar checkout session using predefined products
    const checkoutResponse = await polar.checkouts.create({
      products: [{
        type: 'price',
        id: polarPriceId,
        quantity: 1,
        // Override the price to match the digital product price
        price_amount: Math.round(parseFloat(product.price) * 100), // Amount in cents
        price_currency: 'usd',
      }],
      customerEmail: customer_email,
      customerName: customer_name || customer_email,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases?purchase=success&product=${product_id}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/monetization/digital-products`,
      metadata: {
        user_id: user_id,
        product_id: product_id,
        type: 'digital_product_purchase',
        creator_id: product.user_id,
        product_name: product.name,
        product_type: product.type,
      },
    });

    if (!checkoutResponse.url) {
      throw new Error('Polar checkout URL not returned.');
    }

    // Create pending purchase record in our database
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('digital_product_purchases')
      .insert([{
        product_id: product_id,
        buyer_id: user_id,
        purchase_price: product.price,
        status: 'pending',
        payment_provider: 'polar',
        polar_checkout_id: checkoutResponse.id,
        customer_name: customer_name || customer_email,
        customer_email: customer_email,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating purchase record:', purchaseError);
      throw purchaseError;
    }

    return NextResponse.json({
      success: true,
      checkout_url: checkoutResponse.url,
      checkout_id: checkoutResponse.id,
      purchase_id: purchase.id,
      message: 'Polar checkout created successfully',
    });

  } catch (error) {
    console.error('Error creating Polar digital product checkout:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get Polar price ID based on product type
function getPolarPriceIdForProductType(productType) {
  const typeMap = {
    'course': process.env.POLAR_DIGITAL_COURSE_PRICE_ID,
    'ebook': process.env.POLAR_DIGITAL_EBOOK_PRICE_ID,
    'template': process.env.POLAR_DIGITAL_TEMPLATE_PRICE_ID,
    'software': process.env.POLAR_SOFTWARE_TOOL_PRICE_ID,
    'other': process.env.POLAR_DIGITAL_TEMPLATE_PRICE_ID, // Fallback to template
  };

  return typeMap[productType.toLowerCase()] || typeMap['other'];
}

// Helper function to create Polar product with benefits
async function createPolarProduct(digitalProduct) {
  try {
    // Create the product first
    const product = await polar.products.create({
      name: digitalProduct.name,
      description: digitalProduct.description || `Digital product: ${digitalProduct.name}`,
      prices: [{
        amount_type: 'fixed',
        price_amount: Math.round(digitalProduct.price * 100), // Convert to cents
        price_currency: 'usd',
      }],
      recurring_interval: null, // One-time purchase
      organization_id: process.env.POLAR_ORGANIZATION_ID,
      metadata: {
        platform_product_id: digitalProduct.id,
        product_type: digitalProduct.type,
        creator_id: digitalProduct.user_id,
      },
    });

    console.log(`Created Polar product: ${product.id} for digital product: ${digitalProduct.name}`);

    // TODO: Create benefits for file delivery
    // This would require Polar Benefits API which may need to be configured
    // For now, we'll handle file delivery via webhooks

    return product;
  } catch (error) {
    console.error('Error creating Polar product:', error);
    throw error;
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Polar Digital Products Purchase API endpoint'
  });
}