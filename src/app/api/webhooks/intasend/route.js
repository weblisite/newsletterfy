import { NextResponse } from 'next/server';

// LEGACY WEBHOOK - DISABLED
// IntaSend webhooks are no longer processed
// All payment webhooks now go through: /api/webhooks/polar

export async function POST(request) {
  try {
    console.log('Legacy IntaSend webhook accessed - redirecting to Polar');
    
    return NextResponse.json({
      success: false,
      error: 'IntaSend webhooks are no longer supported.',
      redirect: '/api/webhooks/polar',
      message: 'Payment processing has been migrated to Polar.sh'
    }, { status: 410 }); // 410 Gone
    
    /* ORIGINAL INTASEND WEBHOOK CODE DISABLED
    const payload = await request.json();
    console.log('IntaSend webhook received:', payload);

    const { 
      state, 
      checkout_id, 
      api_ref, 
      amount, 
      currency,
      account,
      charges,
      net_amount,
      failed_reason,
      created_at,
      updated_at
    } = payload;

    // Determine payment type from api_ref
    let paymentType = 'unknown';
    let referenceId = null;
    let userId = null;

    if (api_ref) {
      if (api_ref.includes('donation_')) {
        paymentType = 'donation';
        const parts = api_ref.split('_');
        referenceId = parts[1]; // donation tier ID
        userId = parts[2]; // user ID
      } else if (api_ref.includes('subscription_')) {
        paymentType = 'subscription';
        const parts = api_ref.split('_');
        referenceId = parts[1]; // subscription plan ID
        userId = parts[2]; // user ID
      } else if (api_ref.includes('user_funds_')) {
        paymentType = 'user_funds';
        const parts = api_ref.split('_');
        userId = parts[2]; // user ID
      } else if (api_ref.includes('product_purchase_')) {
        paymentType = 'digital_product';
        const parts = api_ref.split('_');
        referenceId = parts[2]; // product ID
        userId = parts[3]; // user ID
      }
    }

    console.log(`Processing ${paymentType} payment for user ${userId}`);

    // Handle payment based on state
    if (state === 'COMPLETE') {
      await handleSuccessfulPayment(paymentType, {
        checkout_id,
        api_ref,
        amount,
        currency,
        net_amount,
        referenceId,
        userId,
        account,
        charges
      });
    } else if (state === 'FAILED') {
      await handleFailedPayment(paymentType, {
        checkout_id,
        api_ref,
        failed_reason,
        referenceId,
        userId
      });
    } else if (state === 'PENDING') {
      await handlePendingPayment(paymentType, {
        checkout_id,
        api_ref,
        referenceId,
        userId
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('IntaSend webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(paymentType, data) {
  const { checkout_id, api_ref, amount, currency, net_amount, referenceId, userId, account, charges } = data;

  try {
    switch (paymentType) {
      case 'donation':
        await processDonationPayment(data);
        break;
      case 'subscription':
        await processSubscriptionPayment(data);
        break;
      case 'user_funds':
        await processUserFundsPayment(data);
        break;
      case 'digital_product':
        await processDigitalProductPayment(data);
        break;
      default:
        console.log(`Unknown payment type: ${paymentType}`);
    }
  } catch (error) {
    console.error(`Error processing ${paymentType} payment:`, error);
    throw error;
  }
}

async function processDonationPayment(data) {
  const { checkout_id, amount, currency, net_amount, referenceId, userId } = data;

  // Update donation record
  const { error: donationError } = await supabase
    .from('donations')
    .update({
      status: 'completed',
      payment_status: 'paid',
      intasend_payment_id: checkout_id,
      net_amount: net_amount || amount,
      processing_fee: (amount - (net_amount || amount)),
      completed_at: new Date().toISOString()
    })
    .eq('payment_reference', data.api_ref);

  if (donationError) {
    console.error('Error updating donation:', donationError);
    throw donationError;
  }

  // Update creator earnings
  if (referenceId && userId) {
    const { error: earningsError } = await supabase
      .from('user_funds')
      .upsert({
        user_id: userId,
        balance: supabase.raw(`COALESCE(balance, 0) + ${net_amount || amount}`),
        total_earned: supabase.raw(`COALESCE(total_earned, 0) + ${net_amount || amount}`)
      });

    if (earningsError) {
      console.error('Error updating creator earnings:', earningsError);
    }
  }

  console.log(`Donation payment completed: ${checkout_id}`);
}

async function processSubscriptionPayment(data) {
  const { checkout_id, amount, currency, net_amount, referenceId, userId } = data;

  // Update subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      payment_status: 'paid',
      intasend_payment_id: checkout_id,
      last_payment_date: new Date().toISOString(),
      next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    })
    .eq('payment_reference', data.api_ref);

  if (subscriptionError) {
    console.error('Error updating subscription:', subscriptionError);
    throw subscriptionError;
  }

  // Record subscription revenue
  const { error: revenueError } = await supabase
    .from('subscription_revenue_tracking')
    .insert({
      subscription_id: referenceId,
      amount: amount,
      net_amount: net_amount || amount,
      processing_fee: (amount - (net_amount || amount)),
      currency: currency,
      payment_method: 'intasend',
      intasend_payment_id: checkout_id,
      payment_date: new Date().toISOString()
    });

  if (revenueError) {
    console.error('Error recording subscription revenue:', revenueError);
  }

  console.log(`Subscription payment completed: ${checkout_id}`);
}

async function processUserFundsPayment(data) {
  const { checkout_id, amount, currency, net_amount, userId } = data;

  // Update user funds
  const { error: fundsError } = await supabase
    .from('user_funds')
    .upsert({
      user_id: userId,
      balance: supabase.raw(`COALESCE(balance, 0) + ${amount}`),
      total_deposited: supabase.raw(`COALESCE(total_deposited, 0) + ${amount}`)
    });

  if (fundsError) {
    console.error('Error updating user funds:', fundsError);
    throw fundsError;
  }

  // Update transaction record
  const { error: transactionError } = await supabase
    .from('payment_transactions')
    .update({
      status: 'completed',
      intasend_payment_id: checkout_id,
      net_amount: net_amount || amount,
      processing_fee: (amount - (net_amount || amount)),
      completed_at: new Date().toISOString()
    })
    .eq('payment_reference', data.api_ref);

  if (transactionError) {
    console.error('Error updating transaction:', transactionError);
  }

  console.log(`User funds payment completed: ${checkout_id}`);
}

async function processDigitalProductPayment(data) {
  const { checkout_id, amount, currency, net_amount, referenceId, userId } = data;

  // Update purchase record
  const { error: purchaseError } = await supabase
    .from('digital_product_purchases')
    .update({
      status: 'completed',
      payment_status: 'paid',
      intasend_payment_id: checkout_id,
      net_amount: net_amount || amount,
      processing_fee: (amount - (net_amount || amount)),
      completed_at: new Date().toISOString()
    })
    .eq('payment_reference', data.api_ref);

  if (purchaseError) {
    console.error('Error updating purchase:', purchaseError);
    throw purchaseError;
  }

  // Update product sales and revenue
  const { error: productError } = await supabase
    .from('digital_products')
    .update({
      sales: supabase.raw('sales + 1'),
      revenue: supabase.raw(`revenue + ${amount}`)
    })
    .eq('id', referenceId);

  if (productError) {
    console.error('Error updating product stats:', productError);
  }

  // Update creator earnings (80% commission)
  const commission = amount * 0.8;
  const { data: product } = await supabase
    .from('digital_products')
    .select('user_id')
    .eq('id', referenceId)
    .single();

  if (product) {
    const { error: earningsError } = await supabase
      .from('user_funds')
      .upsert({
        user_id: product.user_id,
        balance: supabase.raw(`COALESCE(balance, 0) + ${commission}`),
        total_earned: supabase.raw(`COALESCE(total_earned, 0) + ${commission}`)
      });

    if (earningsError) {
      console.error('Error updating creator earnings:', earningsError);
    }
  }

  console.log(`Digital product payment completed: ${checkout_id}`);
}

async function handleFailedPayment(paymentType, data) {
  const { checkout_id, api_ref, failed_reason, referenceId, userId } = data;

  try {
    // Update relevant records based on payment type
    switch (paymentType) {
      case 'donation':
        await supabase
          .from('donations')
          .update({
            status: 'failed',
            payment_status: 'failed',
            failure_reason: failed_reason,
            failed_at: new Date().toISOString()
          })
          .eq('payment_reference', api_ref);
        break;

      case 'subscription':
        await supabase
          .from('subscriptions')
          .update({
            status: 'payment_failed',
            payment_status: 'failed',
            failure_reason: failed_reason,
            failed_at: new Date().toISOString()
          })
          .eq('payment_reference', api_ref);
        break;

      case 'user_funds':
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            failure_reason: failed_reason,
            failed_at: new Date().toISOString()
          })
          .eq('payment_reference', api_ref);
        break;

      case 'digital_product':
        await supabase
          .from('digital_product_purchases')
          .update({
            status: 'failed',
            payment_status: 'failed',
            failure_reason: failed_reason,
            failed_at: new Date().toISOString()
          })
          .eq('payment_reference', api_ref);
        break;
    }

    console.log(`${paymentType} payment failed: ${checkout_id} - ${failed_reason}`);
  } catch (error) {
    console.error(`Error handling failed ${paymentType} payment:`, error);
    throw error;
  }
}

async function handlePendingPayment(paymentType, data) {
  const { checkout_id, api_ref, referenceId, userId } = data;

  try {
    // Update relevant records to pending status
    switch (paymentType) {
      case 'donation':
        await supabase
          .from('donations')
          .update({
            status: 'pending',
            payment_status: 'pending'
          })
          .eq('payment_reference', api_ref);
        break;

      case 'subscription':
        await supabase
          .from('subscriptions')
          .update({
            status: 'pending',
            payment_status: 'pending'
          })
          .eq('payment_reference', api_ref);
        break;

      case 'user_funds':
        await supabase
          .from('payment_transactions')
          .update({
            status: 'pending'
          })
          .eq('payment_reference', api_ref);
        break;

      case 'digital_product':
        await supabase
          .from('digital_product_purchases')
          .update({
            status: 'pending',
            payment_status: 'pending'
          })
          .eq('payment_reference', api_ref);
        break;
    }

    console.log(`${paymentType} payment pending: ${checkout_id}`);
  } catch (error) {
    console.error(`Error handling pending ${paymentType} payment:`, error);
    throw error;
  }
}

// Handle GET requests for webhook verification (if needed)
export async function GET(request) {
  return NextResponse.json({ 
    message: 'IntaSend webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
} 