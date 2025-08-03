import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import IntaSend from 'intasend-node';
import { sendDonationEmails } from '@/lib/donation-emails';

// Initialize IntaSend with environment variables
const intasend = new IntaSend(
  process.env.INTASEND_PUBLISHABLE_KEY || 'ISPubKey_live_8e8857a5-54ad-4d06-8537-4557857db13b',
  process.env.INTASEND_SECRET_KEY || 'ISSecretKey_live_ce648358-1847-471d-bf9f-24cf3f887c59',
  process.env.NODE_ENV === 'production' ? false : true // true for test environment
);

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    const { 
      amount, 
      recipient_id, 
      tier_id, 
      message, 
      donor_name, 
      donor_email,
      phone_number,
      payment_method = 'card' // card, mpesa, bank
    } = body;

    if (!amount || !recipient_id || !donor_name || !donor_email) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json({ 
        error: 'Invalid donation amount' 
      }, { status: 400 });
    }

    // Verify recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', recipient_id)
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json({ 
        error: 'Recipient not found' 
      }, { status: 404 });
    }

    // Verify tier if provided
    let donationTier = null;
    if (tier_id) {
      const { data: tier, error: tierError } = await supabase
        .from('donation_tiers')
        .select('*')
        .eq('id', tier_id)
        .eq('user_id', recipient_id)
        .single();

      if (tierError || !tier) {
        return NextResponse.json({ 
          error: 'Invalid donation tier' 
        }, { status: 400 });
      }
      
      donationTier = tier;
    }

    // Calculate shares
    const userShare = amount * 0.8; // 80% to creator
    const platformFee = amount * 0.2; // 20% platform fee

    try {
      // Create payment request with IntaSend
      const paymentData = {
        first_name: donor_name.split(' ')[0] || donor_name,
        last_name: donor_name.split(' ')[1] || '',
        email: donor_email,
        host: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        amount: amount,
        currency: 'USD',
        api_ref: `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        comment: message || `Donation to ${recipient.full_name || 'Creator'}`,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/donation/success`,
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/intasend`
      };

      // Add phone number for M-Pesa payments
      if (payment_method === 'mpesa' && phone_number) {
        paymentData.phone_number = phone_number;
      }

      let paymentResponse;

      if (payment_method === 'mpesa' && phone_number) {
        // For M-Pesa STK Push
        const mpesa = intasend.mpesaStk();
        paymentResponse = await mpesa.charge({
          phone_number: phone_number,
          amount: amount,
          currency: 'KES', // M-Pesa typically uses KES
          api_ref: paymentData.api_ref,
          comment: paymentData.comment
        });
      } else {
        // For card and other payment methods - create checkout link
        const checkout = intasend.checkout();
        paymentResponse = await checkout.create(paymentData);
      }

      // Create pending donation record
      const { data: donation, error: donationError } = await supabase
        .from('donations')
        .insert([{
          recipient_id,
          donation_tier_id: tier_id,
          amount,
          user_share: userShare,
          platform_fee: platformFee,
          message,
          status: 'pending',
          supporter: donor_name,
          type: 'donation',
          payment_reference: paymentData.api_ref,
          payment_method: payment_method,
          payment_provider: 'intasend'
        }])
        .select('*')
        .single();

      if (donationError) {
        console.error('Error creating donation record:', donationError);
        return NextResponse.json({ 
          error: 'Failed to process donation' 
        }, { status: 500 });
      }

      // Return appropriate response based on payment method
      if (payment_method === 'mpesa') {
        return NextResponse.json({
          success: true,
          payment_method: 'mpesa',
          checkout_id: paymentResponse.checkout_id || paymentResponse.id,
          message: 'M-Pesa payment initiated. Check your phone for STK push prompt.',
          donation_id: donation.id,
          amount: donation.amount
        });
      } else {
        return NextResponse.json({
          success: true,
          payment_method: 'checkout',
          checkout_url: paymentResponse.url,
          checkout_id: paymentResponse.checkout_id || paymentResponse.id,
          donation_id: donation.id,
          amount: donation.amount,
          message: 'Payment checkout created successfully'
        });
      }

    } catch (intasendError) {
      console.error('IntaSend error:', intasendError);
      return NextResponse.json({ 
        error: 'Payment processing failed',
        details: intasendError.message || 'Unknown payment error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Donation processing error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error.message 
    }, { status: 500 });
  }
}

// Webhook to handle successful payments
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { payment_intent_id, status } = body;

    if (!payment_intent_id) {
      return NextResponse.json({ error: 'Payment intent ID required' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Update donation status
    const { data: donation, error } = await supabase
      .from('donations')
      .update({ status: status === 'succeeded' ? 'completed' : 'failed' })
      .eq('payment_intent_id', payment_intent_id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating donation status:', error);
      return NextResponse.json({ error: 'Failed to update donation' }, { status: 500 });
    }

    // Update recipient's donation stats if successful
    if (status === 'succeeded') {
      try {
        await supabase.rpc('update_user_donation_stats', {
          user_id: donation.recipient_id,
          donation_amount: donation.amount
        });
      } catch (statsError) {
        console.error('Error updating donation stats:', statsError);
      }
    }

    return NextResponse.json({ success: true, donation });
  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 