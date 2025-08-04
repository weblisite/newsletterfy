import { NextResponse } from 'next/server';
import { auth, getPolarProductKey } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Get the current session
    const session = await auth.api.getSession({ 
      headers: {
        cookie: cookies().toString(),
      }
    });
    
    if (!session?.user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    const {
      planType,
      subscriberTier,
      metadata = {}
    } = await request.json();
    
    // Validate plan type and subscriber tier
    if (!['Pro', 'Business'].includes(planType)) {
      return NextResponse.json({
        error: 'Invalid plan type'
      }, { status: 400 });
    }
    
    const validTiers = [1000, 5000, 10000, 25000, 50000, 75000, 100000];
    if (!validTiers.includes(subscriberTier)) {
      return NextResponse.json({
        error: 'Invalid subscriber tier'
      }, { status: 400 });
    }
    
    // Get the product key for Polar plugin
    const productKey = getPolarProductKey(planType, subscriberTier);
    
    // Create checkout session via Better-Auth Polar plugin
    const checkoutResult = await auth.polar.createCheckout({
      userId: session.user.id,
      productKey,
      metadata: {
        ...metadata,
        planType,
        subscriberTier: subscriberTier.toString(),
        source: 'newsletterfy_upgrade',
        userEmail: session.user.email,
        userName: session.user.name,
      },
    });
    
    if (!checkoutResult.success) {
      return NextResponse.json({
        error: checkoutResult.error || 'Failed to create checkout session'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutResult.checkoutUrl,
      productKey,
      planType,
      subscriberTier
    });
    
  } catch (error) {
    console.error('Polar checkout error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}