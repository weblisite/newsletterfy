// LEGACY WEBHOOK - DISABLED
// This webhook handler has been replaced by Polar.sh webhooks
// All payment webhooks now go through: /api/webhooks/polar

import { NextResponse } from 'next/server';

export async function POST(request) {
  // This webhook is deprecated - payments now use Polar.sh
  console.log('Legacy IntaSend webhook received - ignoring');
  
  return NextResponse.json({
    success: false,
    error: 'IntaSend webhooks are no longer supported.',
    message: 'Payment processing has been migrated to Polar.sh'
  }, { status: 410 }); // 410 Gone
}

export async function GET(request) {
  return NextResponse.json({ 
    message: 'IntaSend webhook endpoint is disabled - migrated to Polar.sh',
    timestamp: new Date().toISOString()
  }, { status: 410 });
}