import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Initialize Supabase service role client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Get the current session
    const session = await auth.api.getSession({ 
      headers: {
        cookie: cookies().toString(),
      }
    });
    
    if (!session?.user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Update user to Free plan in database (no Polar involvement needed)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.name,
        plan_type: 'Free',
        subscriber_limit: 1000,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (userError) {
      console.error('Free plan activation error:', userError);
      return NextResponse.json({
        error: 'Failed to activate free plan'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      plan_type: 'Free',
      message: 'Free plan activated successfully',
      redirect_url: '/user-dashboard?welcome=true'
    });

  } catch (error) {
    console.error('Free plan activation error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}