// Better-Auth + Polar Checkout Route
import { auth } from "@/lib/auth";
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // This route is handled by Better-Auth's Polar plugin
    // The actual implementation is in src/lib/auth.js
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Better-Auth Polar plugin handles the checkout creation
    return NextResponse.json({ 
      message: 'Better-Auth Polar checkout integration',
      user: session.user 
    });
  } catch (error) {
    console.error('Better-Auth Polar checkout error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}