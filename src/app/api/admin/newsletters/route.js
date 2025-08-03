import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET newsletters
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for pagination and filters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('newsletters')
      .select('*, users(name, email)', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    // Execute query
    const { data: newsletters, count, error: newslettersError } = await query;

    if (newslettersError) {
      return NextResponse.json({ error: 'Failed to fetch newsletters' }, { status: 500 });
    }

    return NextResponse.json({
      newsletters,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Admin newsletters error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Create newsletter
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newsletterData = await request.json();

    // Create newsletter
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .insert({
        ...newsletterData,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (newsletterError) {
      return NextResponse.json({ error: 'Failed to create newsletter' }, { status: 500 });
    }

    return NextResponse.json(newsletter);
  } catch (error) {
    console.error('Admin newsletters error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Update newsletter
export async function PUT(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updates } = await request.json();

    // Update newsletter
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (newsletterError) {
      return NextResponse.json({ error: 'Failed to update newsletter' }, { status: 500 });
    }

    return NextResponse.json(newsletter);
  } catch (error) {
    console.error('Admin newsletters error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Delete newsletter
export async function DELETE(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    // Delete newsletter
    const { error: newsletterError } = await supabase
      .from('newsletters')
      .delete()
      .eq('id', id);

    if (newsletterError) {
      return NextResponse.json({ error: 'Failed to delete newsletter' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin newsletters error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 