import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  
  // Check if Supabase environment variables are properly configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // If Supabase is not configured, redirect protected routes to signin
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url') || supabaseAnonKey.includes('your_supabase_anon_key')) {
    console.warn('Supabase not configured. Authentication middleware disabled.');
    
    // If trying to access protected routes without proper Supabase config, redirect to login
    if (req.nextUrl.pathname.startsWith('/user-dashboard') ||
        req.nextUrl.pathname.startsWith('/api/monetization')) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    
    return res;
  }

  // If Supabase is configured, proceed with normal authentication
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session and trying to access protected route, redirect to login
  if (!session && (
    req.nextUrl.pathname.startsWith('/user-dashboard') ||
    req.nextUrl.pathname.startsWith('/api/monetization')
  )) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Check if this is a signup page visit with a referral code
  if (req.nextUrl.pathname === '/signup' && req.nextUrl.searchParams.has('ref')) {
    const refCode = req.nextUrl.searchParams.get('ref');

    try {
      // Track the click
      await fetch(`${req.nextUrl.origin}/api/monetization/affiliate-links/${refCode}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'click' })
      });

      // Store the referral code in a cookie for later use during signup
      res.cookies.set('referral_code', refCode, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      });
    } catch (error) {
      console.error('Error tracking affiliate click:', error);
    }
  }

  return res;
}

export const config = {
  matcher: ['/user-dashboard/:path*', '/api/monetization/:path*', '/signup']
};