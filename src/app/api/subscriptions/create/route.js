// LEGACY ROUTE - DISABLED
// This route has been replaced by Polar.sh checkout
// All subscriptions now go through: /api/payments/polar-checkout

import { NextResponse } from 'next/server';

export async function POST(request) {
  // This endpoint is deprecated - Use /api/payments/polar-checkout instead
  console.log('Legacy subscription creation accessed - redirecting to Polar');
  
  return NextResponse.json({
    success: false,
    error: 'IntaSend subscriptions are no longer supported.',
    message: 'Please use Polar checkout for all subscription payments.',
    redirect_endpoint: '/api/payments/polar-checkout'
  }, { status: 410 });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'This legacy endpoint has been replaced by Polar.sh checkout.',
    new_endpoint: '/api/payments/polar-checkout'
  }, { status: 410 });
}