import { NextResponse } from 'next/server';

// TEMPORARILY DISABLED - This route uses Prisma but we're using Supabase
// TODO: Refactor to use Supabase instead of Prisma

export async function GET(request) {
  return NextResponse.json({
    success: false,
    error: 'Newsletter scheduling feature is temporarily disabled',
    message: 'This feature is being migrated from Prisma to Supabase'
  }, { status: 503 });
}

export async function POST(request) {
  return NextResponse.json({
    success: false,
    error: 'Newsletter scheduling feature is temporarily disabled',
    message: 'This feature is being migrated from Prisma to Supabase'
  }, { status: 503 });
}

export async function PUT(request) {
  return NextResponse.json({
    success: false,
    error: 'Newsletter scheduling feature is temporarily disabled',
    message: 'This feature is being migrated from Prisma to Supabase'
  }, { status: 503 });
}

export async function DELETE(request) {
  return NextResponse.json({
    success: false,
    error: 'Newsletter scheduling feature is temporarily disabled',
    message: 'This feature is being migrated from Prisma to Supabase'
  }, { status: 503 });
}