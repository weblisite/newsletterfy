// TEMPORARILY DISABLED - Better-Auth + Polar integration needs fixing
// This route is part of the Better-Auth + Polar.sh integration

import { NextResponse } from 'next/server';

export async function POST(request) {
  return NextResponse.json({
    success: false,
    error: 'Better-Auth + Polar integration is temporarily disabled',
    message: 'This feature is being fixed'
  }, { status: 503 });
}

export async function GET(request) {
  return NextResponse.json({
    success: false,
    error: 'Better-Auth + Polar integration is temporarily disabled',
    message: 'This feature is being fixed'
  }, { status: 503 });
}