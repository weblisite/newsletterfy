import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Get brand profile
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: brand, error } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand profile' },
      { status: 500 }
    );
  }
}

// Create or update brand profile
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      brand_name,
      company_name,
      website,
      industry,
      description,
      logo_url,
      contact_email,
      contact_phone
    } = body;

    // Check if brand already exists
    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    let brandData;

    if (existingBrand) {
      // Update existing brand
      const { data, error } = await supabase
        .from('brands')
        .update({
          brand_name,
          company_name,
          website,
          industry,
          description,
          logo_url,
          contact_email,
          contact_phone
        })
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) throw error;
      brandData = data;
    } else {
      // Create new brand
      const { data, error } = await supabase
        .from('brands')
        .insert([{
          user_id: session.user.id,
          brand_name,
          company_name,
          website,
          industry,
          description,
          logo_url,
          contact_email,
          contact_phone,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      brandData = data;

      // Create brand funds record
      await supabase
        .from('brand_funds')
        .insert([{
          brand_id: brandData.id,
          balance: 0,
          total_deposited: 0,
          total_spent: 0
        }]);
    }

    return NextResponse.json({ brand: brandData });
  } catch (error) {
    console.error('Error creating/updating brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to save brand profile' },
      { status: 500 }
    );
  }
} 