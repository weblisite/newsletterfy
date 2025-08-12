// Free Plan Activation Route - TEMPORARILY DISABLED
// Better-Auth configuration needs fixing

import { NextResponse } from 'next/server';

export async function POST(request) {
  return NextResponse.json({
    success: false,
    error: 'Free plan activation is temporarily disabled',
    message: 'Better-Auth system is being fixed'
  }, { status: 503 });
}