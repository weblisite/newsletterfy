import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: categories, error } = await supabase
      .from('newsletter_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return NextResponse.json({ 
      categories: categories || [],
      success: true 
    });
  } catch (error) {
    console.error('Error in newsletter categories API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 