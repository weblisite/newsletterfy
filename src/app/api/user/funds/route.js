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

// Mock user for development when auth is disabled
const getMockUser = () => ({
  id: '00000000-0000-0000-0000-000000000001',
  email: 'user@example.com',
  user_metadata: { name: 'John Doe' }
});

// GET: Fetch user's funds and recent transactions
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    let user;
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      user = getMockUser();
    } else {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Unauthorized');
      user = authUser;
    }

    // Get user funds
    let { data: funds, error: fundsError } = await supabase
      .from('user_funds')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fundsError && fundsError.code === 'PGRST116') {
      // Create funds record if it doesn't exist
      const { data: newFunds, error: createError } = await supabase
        .from('user_funds')
        .insert([{
          user_id: user.id,
          balance: 5000.00, // Mock starting balance for development
          total_earned: 2000.00,
          total_spent: 1000.00
        }])
        .select()
        .single();

      if (createError) throw createError;
      funds = newFunds;
    } else if (fundsError) {
      throw fundsError;
    }

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transactionsError) throw transactionsError;

    return NextResponse.json({ 
      funds: funds || { balance: 5000, total_earned: 2000, total_spent: 1000 },
      transactions: transactions || []
    });
  } catch (error) {
    console.error('Error fetching funds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funds' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// POST: Add funds or process payment
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    let user;
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      user = getMockUser();
    } else {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Unauthorized');
      user = authUser;
    }

    const { 
      type, 
      amount, 
      description, 
      reference_id, 
      reference_type,
      payment_method = 'card', // card, mpesa, bank
      phone_number,
      customer_name,
      customer_email
    } = await req.json();

    if (!type || !amount) {
      return NextResponse.json(
        { error: 'Type and amount are required' },
        { status: 400 }
      );
    }

    // If this is a wallet top-up (deposit), process with IntaSend
    if (type === 'deposit') {
      try {
        // Prepare payment data for IntaSend
        const paymentData = {
          amount: amount,
          currency: 'USD',
          email: customer_email || user.email,
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/funds?status=success`,
          api_ref: `user_funds_${user.id}_${Date.now()}`
        };

        let paymentResponse;

        if (payment_method === 'mpesa' && phone_number) {
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

        // Create pending transaction record
        const { data: transaction, error: transactionError } = await supabase
          .from('payment_transactions')
          .insert([{
            user_id: user.id,
            type: 'deposit',
            amount: parseFloat(amount),
            description: description || 'Wallet top-up',
            reference_id: reference_id || paymentResponse.id || paymentResponse.checkout_id,
            reference_type: reference_type || 'wallet_topup',
            status: 'pending',
            payment_method,
            payment_provider: 'intasend',
            intasend_payment_id: paymentResponse.id || paymentResponse.checkout_id,
            payment_reference: paymentData.api_ref
          }])
          .select()
          .single();

        if (transactionError) throw transactionError;

        // Return appropriate response based on payment method
        if (payment_method === 'mpesa') {
          return NextResponse.json({
            success: true,
            payment_method: 'mpesa',
            message: 'M-Pesa payment initiated. Check your phone for STK push prompt.',
            checkout_id: paymentResponse.checkout_id || paymentResponse.id,
            transaction
          });
        } else {
          return NextResponse.json({
            success: true,
            payment_method: 'checkout',
            checkout_url: paymentResponse.url,
            checkout_id: paymentResponse.checkout_id || paymentResponse.id,
            message: 'Payment checkout created successfully',
            transaction
          });
        }

      } catch (intasendError) {
        console.error('IntaSend payment error:', intasendError);
        return NextResponse.json({
          error: 'Payment processing failed',
          details: intasendError.message || 'Unknown payment error'
        }, { status: 500 });
      }
    }

    // For other transaction types (earn, spend, withdrawal), process normally
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert([{
        user_id: user.id,
        type,
        amount: parseFloat(amount),
        description,
        reference_id,
        reference_type,
        status: 'completed'
      }])
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update user funds based on transaction type
    let balanceChange = 0;
    if (type === 'deposit' || type === 'earn') {
      balanceChange = parseFloat(amount);
    } else if (type === 'withdrawal' || type === 'spend') {
      balanceChange = -parseFloat(amount);
    }

    const { data: updatedFunds, error: fundsError } = await supabase
      .from('user_funds')
      .update({
        balance: supabase.raw(`balance + ${balanceChange}`),
        total_earned: type === 'earn' ? supabase.raw(`total_earned + ${amount}`) : supabase.raw('total_earned'),
        total_spent: type === 'spend' ? supabase.raw(`total_spent + ${amount}`) : supabase.raw('total_spent')
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (fundsError) throw fundsError;

    return NextResponse.json({ 
      success: true,
      transaction,
      funds: updatedFunds
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}