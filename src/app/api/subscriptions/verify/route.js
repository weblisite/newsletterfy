import { NextResponse } from 'next/server';
import IntaSend from 'intasend-node';

const intasend = new IntaSend(
  process.env.INTASEND_PUBLISHABLE_KEY,
  process.env.INTASEND_SECRET_KEY,
  process.env.NODE_ENV === 'production'
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { payment_id, reference } = body;

    if (!payment_id && !reference) {
      return NextResponse.json(
        { success: false, error: 'Payment ID or reference required' },
        { status: 400 }
      );
    }

    let paymentStatus;
    let subscriptionData = null;

    try {
      // Try to get payment status from IntaSend
      if (payment_id) {
        const collection = intasend.collection();
        paymentStatus = await collection.status(payment_id);
      } else {
        // If only reference is provided, try to find the payment
        // This is a fallback method
        paymentStatus = { state: 'PENDING' }; // Default status
      }

      // Mock subscription data for now - in production you'd fetch from database
      subscriptionData = {
        payment_id: payment_id,
        reference: reference,
        plan_type: 'Pro', // This would come from your database
        subscriber_limit: 1000,
        amount: 29,
        currency: 'USD',
        payment_method: 'card',
        status: paymentStatus.state || 'PENDING',
        created_at: new Date().toISOString()
      };

      // Check payment status
      if (paymentStatus.state === 'COMPLETE' || paymentStatus.state === 'SUCCESSFUL') {
        // Payment successful
        subscriptionData.status = 'active';
        
        // Here you would typically:
        // 1. Update user's subscription in database
        // 2. Grant access to premium features
        // 3. Send welcome email
        // 4. Create invoice record
        
        console.log('Subscription activated:', subscriptionData);

        return NextResponse.json({
          success: true,
          subscription: subscriptionData,
          message: 'Subscription verified and activated successfully'
        });

      } else if (paymentStatus.state === 'FAILED') {
        // Payment failed
        subscriptionData.status = 'failed';
        
        return NextResponse.json({
          success: false,
          error: 'Payment failed',
          subscription: subscriptionData
        });

      } else {
        // Payment still pending
        subscriptionData.status = 'pending';
        
        return NextResponse.json({
          success: false,
          error: 'Payment is still being processed',
          subscription: subscriptionData,
          status: 'pending'
        });
      }

    } catch (intasendError) {
      console.error('IntaSend verification error:', intasendError);
      
      // If verification fails, return pending status
      return NextResponse.json({
        success: false,
        error: 'Unable to verify payment status. Please try again in a few minutes.',
        status: 'verification_failed'
      });
    }

  } catch (error) {
    console.error('Subscription verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Subscription verification API endpoint'
  });
} 