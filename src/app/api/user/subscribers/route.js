import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch subscribers for the authenticated user
    const { data: subscribers, error: subscribersError } = await supabase
      .from('subscribers')
      .select(`
        *,
        subscriber_engagement (
          engagement_type,
          created_at,
          newsletter_name
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    // Calculate stats
    const total = subscribers?.length || 0;
    const active = subscribers?.filter(s => s.status === 'active').length || 0;
    const unsubscribed = subscribers?.filter(s => s.status === 'unsubscribed').length || 0;
    const bounced = subscribers?.filter(s => s.status === 'bounced').length || 0;

    // Calculate growth (this would need historical data in a real implementation)
    const growth = total > 0 ? ((active / total) * 100) - 85 : 0; // Mock calculation

    // Calculate engagement (based on recent activity)
    const recentEngagement = subscribers?.filter(s => 
      s.last_engagement && 
      new Date(s.last_engagement) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length || 0;
    const engagement = total > 0 ? (recentEngagement / total) * 100 : 0;

    // Format subscribers data for frontend
    const formattedSubscribers = subscribers?.map(subscriber => ({
      id: subscriber.id,
      email: subscriber.email,
      name: subscriber.name,
      joinDate: subscriber.created_at?.split('T')[0],
      status: subscriber.status,
      newsletters: subscriber.tags || [],
      stats: {
        lastOpened: subscriber.last_engagement,
        totalOpens: subscriber.subscriber_engagement?.filter(e => e.engagement_type === 'open').length || 0,
        totalClicks: subscriber.subscriber_engagement?.filter(e => e.engagement_type === 'click').length || 0,
        location: "Unknown", // Would need additional data
        openRate: Math.floor(Math.random() * 40) + 60, // Mock data
        clickRate: Math.floor(Math.random() * 20) + 20, // Mock data
        qualityScore: Math.floor(Math.random() * 30) + 70, // Mock data
        engagementHistory: subscriber.subscriber_engagement?.slice(0, 5) || []
      }
    })) || [];

    const stats = {
      total,
      active,
      unsubscribed,
      bounced,
      growth: Math.round(growth * 10) / 10,
      engagement: Math.round(engagement * 10) / 10
    };

    return NextResponse.json({ 
      subscribers: formattedSubscribers,
      stats,
      success: true 
    });
  } catch (error) {
    console.error('Error in user subscribers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, tags, source = 'manual' } = body;

    // Check if subscriber already exists
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Subscriber already exists' }, { status: 400 });
    }

    // Add new subscriber
    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .insert({
        user_id: session.user.id,
        email,
        name,
        status: 'active',
        tags: tags || [],
        source,
        preferences: {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscriber:', error);
      return NextResponse.json({ error: 'Failed to create subscriber' }, { status: 500 });
    }

    return NextResponse.json({ 
      subscriber,
      success: true 
    });
  } catch (error) {
    console.error('Error in user subscribers POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 