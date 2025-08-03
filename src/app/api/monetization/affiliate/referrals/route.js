import { NextResponse } from 'next/server';
import { checkAuth, getSupabaseClient } from '@/lib/auth-utils';

// Get all affiliate referrals for the authenticated user
export async function GET(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('affiliate_referrals')
      .select('*, affiliate_links(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching affiliate referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affiliate referrals' },
      { status: 500 }
    );
  }
}

// Create a new affiliate referral
export async function POST(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { referred_user, plan, amount, commission, status, link_id } = body;

    // Verify the affiliate link belongs to the user
    const { data: linkData, error: linkError } = await supabase
      .from('affiliate_links')
      .select('id')
      .eq('id', link_id)
      .eq('user_id', session.user.id)
      .single();

    if (linkError || !linkData) {
      return NextResponse.json(
        { error: 'Invalid affiliate link' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('affiliate_referrals')
      .insert([
        {
          user_id: session.user.id,
          referred_user,
          plan,
          amount,
          commission,
          status: status || 'pending',
          link_id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Update affiliate link stats
    await supabase.rpc('update_affiliate_link_stats', { link_id });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating affiliate referral:', error);
    return NextResponse.json(
      { error: 'Failed to create affiliate referral' },
      { status: 500 }
    );
  }
}

// Update an affiliate referral
export async function PATCH(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    const { data, error } = await supabase
      .from('affiliate_referrals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    // If status is updated, update affiliate link stats
    if (updateData.status) {
      const { data: referral } = await supabase
        .from('affiliate_referrals')
        .select('link_id')
        .eq('id', id)
        .single();

      if (referral?.link_id) {
        await supabase.rpc('update_affiliate_link_stats', { link_id: referral.link_id });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating affiliate referral:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate referral' },
      { status: 500 }
    );
  }
}

// Delete an affiliate referral
export async function DELETE(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Referral ID is required' },
        { status: 400 }
      );
    }

    // Get the link_id before deleting
    const { data: referral } = await supabase
      .from('affiliate_referrals')
      .select('link_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('affiliate_referrals')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    // Update affiliate link stats after deletion
    if (referral?.link_id) {
      await supabase.rpc('update_affiliate_link_stats', { link_id: referral.link_id });
    }

    return NextResponse.json({ message: 'Affiliate referral deleted successfully' });
  } catch (error) {
    console.error('Error deleting affiliate referral:', error);
    return NextResponse.json(
      { error: 'Failed to delete affiliate referral' },
      { status: 500 }
    );
  }
} 