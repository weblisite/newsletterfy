import { NextResponse } from 'next/server';
import IntaSend from 'intasend-node';

const intasend = new IntaSend(
  process.env.INTASEND_PUBLISHABLE_KEY,
  process.env.INTASEND_SECRET_KEY,
  process.env.NODE_ENV === 'production' // Use production environment in production
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      amount, 
      email, 
      phone, 
      plan_type, 
      subscriber_limit, 
      payment_method,
      currency = 'USD', // Default to USD, can be KES for M-Pesa
      user_id
    } = body;

    // Validate required fields
    if (!amount || !email || !plan_type || !subscriber_limit || !payment_method) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Validate phone number for M-Pesa payments
    if (payment_method === 'mpesa' && (!phone || !phone.startsWith('254'))) {
      return NextResponse.json(
        { success: false, error: 'Valid phone number (254XXXXXXXXX) required for M-Pesa payments' },
        { status: 400 }
      );
    }

    // Prepare payment data
    const paymentData = {
      amount: parseFloat(amount),
      currency: payment_method === 'mpesa' ? 'KES' : currency,
      email: email,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
      api_ref: `subscription_${plan_type}_${email.replace('@', '_').replace('.', '_')}_${Date.now()}`
    };

    // Add payment method specific data
    if (payment_method === 'mpesa') {
      paymentData.phone_number = phone;
    }

    let paymentResponse;

    try {
      switch (payment_method) {
        case 'card':
          // Create card payment checkout
          paymentResponse = await intasend.collection().charge({
            ...paymentData,
            method: 'CARD-PAYMENT'
          });
          break;

        case 'mpesa':
          // Create M-Pesa STK Push
          const collection = intasend.collection();
          paymentResponse = await collection.mpesaStkPush({
            ...paymentData,
            phone_number: phone
          });
          break;

        case 'bank':
          // Create bank payment checkout
          paymentResponse = await intasend.collection().charge({
            ...paymentData,
            method: 'BANK-TRANSFER'
          });
          break;

        default:
          return NextResponse.json(
            { success: false, error: 'Invalid payment method' },
            { status: 400 }
          );
      }

      // Store subscription information for webhook processing
      const subscriptionData = {
        payment_id: paymentResponse.id || paymentResponse.invoice?.invoice_id,
        payment_reference: paymentData.api_ref,
        user_email: email,
        phone_number: phone,
        plan_type: plan_type,
        subscriber_limit: subscriber_limit,
        amount: amount,
        currency: paymentData.currency,
        payment_method: payment_method,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('Subscription created:', subscriptionData);

      return NextResponse.json({
        success: true,
        payment_data: paymentResponse,
        subscription_data: subscriptionData,
        payment_url: paymentResponse.url || paymentResponse.checkout_url,
        message: `${plan_type} subscription payment initiated successfully`
      });

    } catch (intasendError) {
      console.error('IntaSend API Error:', intasendError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment processing failed',
          details: intasendError.message 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Subscription API endpoint',
    supported_methods: ['card', 'mpesa', 'bank'],
    supported_currencies: ['USD', 'KES']
  });
} 