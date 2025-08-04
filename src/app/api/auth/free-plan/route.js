// TEMPORARILY DISABLED - Better-Auth configuration needs fixing
// This route activates the free plan for users

import { NextResponse } from 'next/server';

export async function POST(request) {
  return NextResponse.json({
    success: false,
    error: 'Free plan activation is temporarily disabled',
    message: 'Authentication system is being fixed'
  }, { status: 503 });
}