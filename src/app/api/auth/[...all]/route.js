// TEMPORARILY DISABLED - Better-Auth configuration needs fixing
// This is the main Better-Auth route handler

import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({
    success: false,
    error: 'Better-Auth is temporarily disabled',
    message: 'Authentication system is being fixed'
  }, { status: 503 });
}

export async function POST(request) {
  return NextResponse.json({
    success: false,
    error: 'Better-Auth is temporarily disabled', 
    message: 'Authentication system is being fixed'
  }, { status: 503 });
}