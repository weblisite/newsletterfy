import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import IntaSend from 'intasend-node'; // DISABLED - Using Polar.sh for payments

// DISABLED - IntaSend integration disabled in favor of Polar.sh
// const intasend = new IntaSend(...);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET funds data
export async function GET(request) {
  try {
    // Get brand ID from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const brandId = session?.user?.id;
    if (!brandId) throw new Error('Brand ID not found');

    // Fetch funds data from database
    const { data: fundsData, error: fundsError } = await supabase
      .from('brand_funds')
      .select('*')
      .eq('brand_id', brandId)
      .single();

    if (fundsError) throw fundsError;

    // Fetch transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('brand_transactions')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (transactionsError) throw transactionsError;

    // Fetch saved payment methods from IntaSend (if customer exists)
    let savedCards = [];
    try {
      if (fundsData.intasend_customer_id) {
        const customer = await intasend.customers().retrieve(fundsData.intasend_customer_id);
        // IntaSend doesn't store cards the same way as Stripe, so we'll use our database
        const { data: paymentMethods } = await supabase
          .from('brand_payment_methods')
          .select('*')
          .eq('brand_id', brandId)
          .eq('is_active', true);

        savedCards = paymentMethods?.map(pm => ({
          id: pm.id,
          cardNumber: `**** **** **** ${pm.card_last_four}`,
          cardholderName: pm.cardholder_name,
          expiryDate: pm.expiry_date,
          brand: pm.card_brand,
          isDefault: pm.is_default,
        })) || [];
      }
    } catch (intasendError) {
      console.warn('Error fetching IntaSend customer:', intasendError);
    }

    // Format the response
    const response = {
      balanceStats: {
        availableBalance: fundsData.available_balance || 0,
        pendingBalance: fundsData.pending_balance || 0,
        totalSpent: fundsData.total_spent || 0,
        totalBudget: fundsData.total_budget || 0,
      },
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        date: tx.created_at.split('T')[0],
        method: tx.payment_method,
        description: tx.description,
      })),
      savedCards,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Funds API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch funds data' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// POST add funds
export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, paymentMethod, cardId, newCard, phone_number } = body;

    // Get brand ID from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const brandId = session?.user?.id;
    if (!brandId) throw new Error('Brand ID not found');

    // Get brand's IntaSend customer ID or create new customer
    let { data: fundsData, error: fundsError } = await supabase
      .from('brand_funds')
      .select('*')
      .eq('brand_id', brandId)
      .single();

    if (fundsError && fundsError.code === 'PGRST116') {
      // Create brand funds record if it doesn't exist
      const { data: brandData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', brandId)
        .single();

      const { data: newFundsData, error: createError } = await supabase
        .from('brand_funds')
        .insert({
          brand_id: brandId,
          available_balance: 0,
          pending_balance: 0,
          total_spent: 0,
          total_budget: 0
        })
        .select()
        .single();

      if (createError) throw createError;
      fundsData = newFundsData;
    } else if (fundsError) {
      throw fundsError;
    }

    // Get or create IntaSend customer
    let customerId = fundsData.intasend_customer_id;
    if (!customerId) {
      const { data: brandData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', brandId)
        .single();

      try {
        const customer = await intasend.customers().create({
          email: brandData.email,
          first_name: brandData.full_name?.split(' ')[0] || 'Brand',
          last_name: brandData.full_name?.split(' ').slice(1).join(' ') || 'User',
          phone_number: phone_number || null
        });

        customerId = customer.id || customer.customer_id;

        // Update brand funds with customer ID
        await supabase
          .from('brand_funds')
          .update({ intasend_customer_id: customerId })
          .eq('brand_id', brandId);
      } catch (customerError) {
        console.error('Error creating IntaSend customer:', customerError);
        throw new Error('Failed to create payment customer');
      }
    }

    try {
      // Prepare payment data for IntaSend
      const paymentData = {
        amount: amount,
        currency: 'USD',
        email: session.user.email,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/brand-dashboard/funds?status=success`,
        api_ref: `brand_funds_${brandId}_${Date.now()}`
      };

      let paymentResponse;

      if (paymentMethod === 'mpesa' && phone_number) {
        // Process M-Pesa payment
        paymentResponse = await intasend.mpesa().stkPush({
          phone_number: phone_number,
          amount: amount,
          currency: 'KES', // M-Pesa only supports KES
          api_ref: paymentData.api_ref
        });
      } else {
        // Process card/bank payment via checkout
        paymentResponse = await intasend.collection().charge(paymentData);
      }

      if (paymentResponse.status === 'PENDING' || paymentResponse.url) {
        // Create transaction record
        const { error: transactionError } = await supabase
          .from('brand_transactions')
          .insert({
            brand_id: brandId,
            type: 'deposit',
            amount: amount,
            status: 'pending',
            payment_method: paymentMethod === 'mpesa' ? `M-Pesa (${phone_number})` : 'Credit Card',
            description: 'Funds added',
            intasend_payment_id: paymentResponse.id || paymentResponse.checkout_id,
            payment_reference: paymentData.api_ref,
            payment_provider: 'intasend'
          });

        if (transactionError) throw transactionError;

        // Save new payment method if provided
        if (newCard && newCard.saveCard) {
          await supabase
            .from('brand_payment_methods')
            .insert({
              brand_id: brandId,
              card_last_four: newCard.cardNumber?.slice(-4) || '****',
              cardholder_name: newCard.cardholderName,
              expiry_date: newCard.expiryDate,
              card_brand: getCardBrand(newCard.cardNumber),
              is_default: true,
              is_active: true
            });
        }

        // Return appropriate response based on payment method
        if (paymentMethod === 'mpesa') {
          return NextResponse.json({
            success: true,
            payment_method: 'mpesa',
            message: 'M-Pesa payment initiated. Check your phone for STK push prompt.',
            checkout_id: paymentResponse.checkout_id || paymentResponse.id
          });
        } else {
          return NextResponse.json({
            success: true,
            payment_method: 'checkout',
            checkout_url: paymentResponse.url,
            checkout_id: paymentResponse.checkout_id || paymentResponse.id,
            message: 'Payment checkout created successfully'
          });
        }
      } else {
        throw new Error('Payment processing failed');
      }
    } catch (intasendError) {
      console.error('IntaSend payment error:', intasendError);
      throw new Error(`Payment processing failed: ${intasendError.message}`);
    }
  } catch (error) {
    console.error('Add Funds API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add funds' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// Helper function to detect card brand
function getCardBrand(cardNumber) {
  if (!cardNumber) return 'unknown';
  
  const number = cardNumber.replace(/\s/g, '');
  
  if (number.startsWith('4')) return 'visa';
  if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
  if (number.startsWith('3')) return 'amex';
  if (number.startsWith('6')) return 'discover';
  
  return 'unknown';
}