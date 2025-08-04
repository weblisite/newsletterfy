import { NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { createClient } from '@supabase/supabase-js';

// Initialize Polar SDK
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server: "production", // Use production server
});

// Initialize Supabase Admin Client (for server-side operations)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const {
      amount,
      customer_email,
      customer_name,
      user_id,
      description = 'Wallet deposit'
    } = await request.json();

    // Validate required fields
    if (!amount || !customer_email || !user_id) {
      return NextResponse.json({
        error: 'Missing required fields: amount, customer_email, user_id'
      }, { status: 400 });
    }

    // Validate amount
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 1) {
      return NextResponse.json({
        error: 'Amount must be at least $1.00'
      }, { status: 400 });
    }

    // Convert amount to cents for Polar (they use cents)
    const amountInCents = Math.round(depositAmount * 100);

    // Create a unique reference for this deposit
    const depositReference = `wallet_deposit_${user_id}_${Date.now()}`;

    // Create Polar checkout session for wallet deposit
    const checkoutResponse = await polar.checkouts.create({
      // Use the Wallet Credit product we created via Polar MCP
      productPriceId: process.env.POLAR_WALLET_CREDIT_PRICE_ID || "df752572-7ab8-4b14-a1a5-9cf7f12fb1b6", // Fallback to our created price ID
      customerEmail: customer_email,
      customerName: customer_name || customer_email,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/funds?deposit=success&ref=${depositReference}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/funds?deposit=cancelled`,
      metadata: {
        type: 'wallet_deposit',
        user_id: user_id,
        amount: depositAmount.toString(),
        reference: depositReference,
        description: description
      }
    });

    // Create pending transaction record in database
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .insert([{
        user_id: user_id,
        type: 'deposit',
        amount: depositAmount,
        description: description,
        reference_id: depositReference,
        reference_type: 'wallet_deposit',
        status: 'pending',
        payment_method: 'card', // Polar handles various payment methods
        payment_provider: 'polar',
        polar_checkout_id: checkoutResponse.id,
        payment_reference: depositReference
      }])
      .select()
      .single();

    if (transactionError) {
      console.error('Database transaction error:', transactionError);
      throw transactionError;
    }

    return NextResponse.json({
      success: true,
      checkout_url: checkoutResponse.url,
      checkout_id: checkoutResponse.id,
      reference: depositReference,
      amount: depositAmount,
      message: 'Wallet deposit checkout created successfully',
      transaction: transaction
    });

  } catch (error) {
    console.error('Polar wallet deposit error:', error);
    return NextResponse.json({
      error: 'Failed to create wallet deposit checkout',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Polar wallet deposit API endpoint',
    usage: 'POST with amount, customer_email, customer_name, user_id'
  });
}