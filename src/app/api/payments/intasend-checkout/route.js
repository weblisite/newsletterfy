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

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    const {
      payment_type, // 'donation', 'subscription', 'digital_product', 'user_funds'
      amount,
      currency = 'USD',
      payment_method = 'card', // 'card', 'mpesa', 'bank'
      customer_name,
      customer_email,
      phone_number,
      description,
      metadata = {},
      redirect_url,
      // Type-specific fields
      recipient_id, // for donations
      tier_id, // for donations/subscriptions
      product_id, // for digital products
      user_id // for user funds
    } = await request.json();

    // Validate required fields
    if (!payment_type || !amount || !customer_name || !customer_email) {
      return NextResponse.json({
        error: 'Missing required fields: payment_type, amount, customer_name, customer_email'
      }, { status: 400 });
    }

    // Validate payment method for M-Pesa
    if (payment_method === 'mpesa' && !phone_number) {
      return NextResponse.json({
        error: 'Phone number is required for M-Pesa payments'
      }, { status: 400 });
    }

    // Generate unique API reference
    const api_ref = `${payment_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare base payment data
    const paymentData = {
      first_name: customer_name.split(' ')[0] || customer_name,
      last_name: customer_name.split(' ').slice(1).join(' ') || '',
      email: customer_email,
      host: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      api_ref: api_ref,
      comment: description || `${payment_type} payment`,
      redirect_url: redirect_url || `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?ref=${api_ref}`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/intasend`,
      metadata: {
        payment_type,
        recipient_id,
        tier_id,
        product_id,
        user_id: user_id || session?.user?.id,
        ...metadata
      }
    };

    // Add phone number for M-Pesa
    if (payment_method === 'mpesa' && phone_number) {
      paymentData.phone_number = phone_number;
    }

    let paymentResponse;

    try {
      if (payment_method === 'mpesa' && phone_number) {
        // For M-Pesa STK Push
        paymentResponse = await intasend.mpesa().stkPush({
          phone_number: phone_number,
          amount: paymentData.amount,
          currency: 'KES', // M-Pesa only supports KES
          api_ref: paymentData.api_ref,
          comment: paymentData.comment
        });
      } else {
        // For card and bank payments - create checkout link
        paymentResponse = await intasend.collection().charge(paymentData);
      }
    } catch (intasendError) {
      console.error('IntaSend API error:', intasendError);
      return NextResponse.json({
        error: 'Payment service error',
        details: intasendError.message || 'Failed to create payment'
      }, { status: 500 });
    }

    // Create payment record in database based on type
    let recordId = null;
    try {
      switch (payment_type) {
        case 'donation':
          const { data: donation, error: donationError } = await supabase
            .from('donations')
            .insert([{
              recipient_id,
              donation_tier_id: tier_id,
              amount: paymentData.amount,
              user_share: paymentData.amount * 0.8,
              platform_fee: paymentData.amount * 0.2,
              supporter: customer_name,
              status: 'pending',
              payment_reference: api_ref,
              payment_method,
              payment_provider: 'intasend',
              intasend_payment_id: paymentResponse.id || paymentResponse.checkout_id
            }])
            .select('id')
            .single();

          if (donationError) throw donationError;
          recordId = donation.id;
          break;

        case 'subscription':
          const { data: subscription, error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert([{
              user_id: session?.user?.id,
              plan_id: tier_id,
              status: 'pending',
              payment_status: 'pending',
              amount: paymentData.amount,
              currency: paymentData.currency,
              payment_method,
              payment_reference: api_ref,
              intasend_payment_id: paymentResponse.id || paymentResponse.checkout_id,
              customer_name,
              customer_email,
              phone_number
            }])
            .select('id')
            .single();

          if (subscriptionError) throw subscriptionError;
          recordId = subscription.id;
          break;

        case 'digital_product':
          const { data: purchase, error: purchaseError } = await supabase
            .from('digital_product_purchases')
            .insert([{
              product_id,
              user_id: session?.user?.id,
              amount: paymentData.amount,
              commission: paymentData.amount * 0.8,
              platform_fee: paymentData.amount * 0.2,
              status: 'pending',
              payment_method,
              payment_provider: 'intasend',
              payment_reference: api_ref,
              intasend_payment_id: paymentResponse.id || paymentResponse.checkout_id,
              customer_name,
              customer_email,
              phone_number
            }])
            .select('id')
            .single();

          if (purchaseError) throw purchaseError;
          recordId = purchase.id;
          break;

        case 'user_funds':
          const { data: transaction, error: transactionError } = await supabase
            .from('payment_transactions')
            .insert([{
              user_id: user_id || session?.user?.id,
              type: 'deposit',
              amount: paymentData.amount,
              description: 'Wallet top-up',
              status: 'pending',
              payment_method,
              payment_provider: 'intasend',
              payment_reference: api_ref,
              intasend_payment_id: paymentResponse.id || paymentResponse.checkout_id
            }])
            .select('id')
            .single();

          if (transactionError) throw transactionError;
          recordId = transaction.id;
          break;

        default:
          console.warn(`Unknown payment type: ${payment_type}`);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the payment if database insert fails
      // The webhook will handle creating/updating records
    }

    // Return response based on payment method
    const response = {
      success: true,
      payment_reference: api_ref,
      payment_method,
      amount: paymentData.amount,
      currency: paymentData.currency,
      record_id: recordId
    };

    if (payment_method === 'mpesa') {
      response.message = 'M-Pesa payment initiated. Check your phone for STK push prompt.';
      response.checkout_id = paymentResponse.checkout_id || paymentResponse.id;
    } else {
      response.checkout_url = paymentResponse.url;
      response.checkout_id = paymentResponse.checkout_id || paymentResponse.id;
      response.message = 'Payment checkout created successfully';
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}