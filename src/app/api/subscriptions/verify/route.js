import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// This endpoint is now disabled - Polar webhooks handle payment verification
export async function POST(request) {
  // This endpoint is deprecated - Polar webhooks handle all payment verification
  console.log('Legacy payment verification accessed - now handled by Polar webhooks');
  
  return NextResponse.json({
    success: false,
    error: 'Payment verification is now handled automatically by Polar webhooks.',
    message: 'Payments are processed in real-time. Check your dashboard for subscription status.',
    redirect_url: '/user-dashboard'
  }, { status: 410 });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Subscription verification API endpoint'
  });
} 