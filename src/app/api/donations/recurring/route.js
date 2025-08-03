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

// GET /api/donations/recurring - Get user's recurring donations
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'sent' or 'received'

    let query = supabase
      .from('recurring_donations')
      .select(`
        *,
        donation_tiers (
          id,
          name,
          amount,
          description
        )
      `)
      .order('created_at', { ascending: false });

    if (type === 'sent') {
      query = query.eq('donor_id', session.user.id);
    } else {
      query = query.eq('recipient_id', session.user.id);
    }

    const { data: recurringDonations, error } = await query;

    if (error) throw error;

    // Calculate analytics
    const totalSubscriptions = recurringDonations?.length || 0;
    const activeSubscriptions = recurringDonations?.filter(rd => rd.status === 'active').length || 0;
    const monthlyRevenue = recurringDonations
      ?.filter(rd => rd.status === 'active' && rd.frequency === 'monthly')
      .reduce((sum, rd) => sum + parseFloat(rd.amount), 0) || 0;
    const totalRevenue = recurringDonations
      ?.reduce((sum, rd) => sum + parseFloat(rd.total_amount), 0) || 0;

    return NextResponse.json({
      recurring_donations: recurringDonations,
      analytics: {
        totalSubscriptions,
        activeSubscriptions,
        monthlyRevenue: type === 'received' ? monthlyRevenue * 0.8 : monthlyRevenue, // Apply 80% share for recipients
        totalRevenue: type === 'received' ? totalRevenue * 0.8 : totalRevenue,
        userShare: type === 'received' ? totalRevenue * 0.8 : null,
        platformFee: type === 'received' ? totalRevenue * 0.2 : null
      }
    });
  } catch (error) {
    console.error('Error fetching recurring donations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/donations/recurring - Create new recurring donation
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();
    
    const { 
      recipient_id,
      tier_id,
      amount,
      frequency, // 'weekly', 'monthly', 'quarterly', 'yearly'
      message,
      donor_name,
      donor_email,
      phone_number,
      payment_method = 'card' // card, mpesa, bank
    } = body;

    if (!amount || !recipient_id || !frequency || !donor_name || !donor_email) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate frequency
    if (!['weekly', 'monthly', 'quarterly', 'yearly'].includes(frequency)) {
      return NextResponse.json({ 
        error: 'Invalid frequency' 
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

    // Check if IntaSend is configured
    if (!process.env.INTASEND_SECRET_KEY || process.env.INTASEND_SECRET_KEY === 'ISSecretKey_live_ce648358-1847-471d-bf9f-24cf3f887c59') {
      return NextResponse.json({ 
        error: 'Recurring donations require IntaSend configuration' 
      }, { status: 400 });
    }

    try {
      // Create or get IntaSend customer
      const customer = await getOrCreateIntaSendCustomer(donor_email, donor_name, phone_number);

      // Map frequency to IntaSend billing intervals
      const intervalMap = {
        'weekly': 'weekly',
        'monthly': 'monthly', 
        'quarterly': 'monthly', // Will charge every 3 months
        'yearly': 'yearly'
      };

      // Calculate next payment date
      const nextPaymentDate = new Date();
      switch (frequency) {
        case 'weekly':
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
          break;
        case 'monthly':
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
          break;
        case 'yearly':
          nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
          break;
      }

      // Create recurring payment plan with IntaSend
      const subscriptionPlan = {
        name: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Donation to ${recipient.full_name}`,
        amount: amount,
        currency: 'USD',
        interval: intervalMap[frequency],
        customer_email: donor_email,
        customer_name: donor_name,
        phone_number: phone_number || null,
        metadata: {
          recipient_id,
          tier_id: tier_id || '',
          donor_name,
          donor_email,
          message: message || '',
          frequency,
          type: 'recurring_donation'
        }
      };

      // Create subscription with IntaSend
      const subscription = await intasend.subscriptions().create(subscriptionPlan);

      // Create recurring donation record
      const { data: recurringDonation, error: recurringError } = await supabase
        .from('recurring_donations')
        .insert([{
          donor_id: null, // Anonymous donation
          recipient_id,
          tier_id,
          amount: parseFloat(amount),
          frequency,
          message,
          donor_name,
          donor_email,
          phone_number,
          status: 'active',
          next_payment_date: nextPaymentDate.toISOString(),
          total_amount: parseFloat(amount),
          payment_count: 0,
          intasend_subscription_id: subscription.id || subscription.subscription_id,
          payment_method,
          payment_provider: 'intasend'
        }])
        .select('*')
        .single();

      if (recurringError) {
        console.error('Error creating recurring donation record:', recurringError);
        // Try to cancel the IntaSend subscription if donation record creation failed
        try {
          await intasend.subscriptions().cancel(subscription.id || subscription.subscription_id);
        } catch (cancelError) {
          console.error('Error canceling IntaSend subscription:', cancelError);
        }
        
        return NextResponse.json({ 
          error: 'Failed to create recurring donation' 
        }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Recurring donation created successfully',
        recurring_donation: recurringDonation,
        next_payment_date: nextPaymentDate.toISOString(),
        subscription_id: subscription.id || subscription.subscription_id
      });

    } catch (intasendError) {
      console.error('IntaSend error:', intasendError);
      return NextResponse.json({ 
        error: 'Payment processing failed',
        details: intasendError.message || 'Unknown payment error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Recurring donation error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error.message 
    }, { status: 500 });
  }
}

// PATCH /api/donations/recurring - Update recurring donation
export async function PATCH(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();
    
    const { id, action, amount } = body; // action: 'pause', 'resume', 'cancel', 'update_amount'

    if (!id || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Get recurring donation
    const { data: recurringDonation, error: recurringError } = await supabase
      .from('recurring_donations')
      .select('*')
      .eq('id', id)
      .single();

    if (recurringError || !recurringDonation) {
      return NextResponse.json({ 
        error: 'Recurring donation not found' 
      }, { status: 404 });
    }

    try {
      let intasendAction;
      let updateData = {};

      switch (action) {
        case 'pause':
          intasendAction = () => intasend.subscriptions().pause(recurringDonation.intasend_subscription_id);
          updateData.status = 'paused';
          break;
        case 'resume':
          intasendAction = () => intasend.subscriptions().resume(recurringDonation.intasend_subscription_id);
          updateData.status = 'active';
          break;
        case 'cancel':
          intasendAction = () => intasend.subscriptions().cancel(recurringDonation.intasend_subscription_id);
          updateData.status = 'cancelled';
          break;
        case 'update_amount':
          if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
          }
          intasendAction = () => intasend.subscriptions().update(recurringDonation.intasend_subscription_id, {
            amount: amount
          });
          updateData.amount = parseFloat(amount);
          break;
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      // Update IntaSend subscription
      if (recurringDonation.intasend_subscription_id) {
        await intasendAction();
      }

      // Update local database
      const { data: updatedDonation, error: updateError } = await supabase
        .from('recurring_donations')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        message: `Recurring donation ${action}d successfully`,
        recurring_donation: updatedDonation
      });

    } catch (intasendError) {
      console.error('IntaSend error:', intasendError);
      return NextResponse.json({ 
        error: 'Payment update failed',
        details: intasendError.message || 'Unknown payment error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Update recurring donation error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function to get or create IntaSend customer
async function getOrCreateIntaSendCustomer(email, name, phone_number) {
  try {
    // Try to get existing customer
    const customers = await intasend.customers().list({
      email: email
    });

    if (customers && customers.length > 0) {
      return customers[0];
    }

    // Create new customer
    const customer = await intasend.customers().create({
      email: email,
      first_name: name.split(' ')[0] || name,
      last_name: name.split(' ').slice(1).join(' ') || '',
      phone_number: phone_number || null
    });

    return customer;
  } catch (error) {
    console.error('Error with IntaSend customer:', error);
    throw error;
  }
}