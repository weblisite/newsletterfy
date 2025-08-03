import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        throw error
      }

      if (user) {
        // Create user profile in database if it doesn't exist
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingUser) {
          await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name,
              avatar_url: user.user_metadata?.avatar_url,
              plan_type: 'Free', // Default plan for OAuth users
              created_at: new Date().toISOString()
            })
        }

        // Check for pending plan from OAuth signup
        // This would be set by the frontend before OAuth redirect
        // We'll use URL params as fallback for plan information
        const planParam = requestUrl.searchParams.get('plan')
        const tierParam = requestUrl.searchParams.get('tier')
        const priceParam = requestUrl.searchParams.get('price')

        if (planParam && tierParam && priceParam && planParam !== 'Free') {
          // User has a pending paid plan, redirect to payment
          const planParams = new URLSearchParams({
            plan: planParam,
            tier: tierParam,
            price: priceParam
          })
          return NextResponse.redirect(`${requestUrl.origin}/auth/payment?${planParams.toString()}`)
        }
      }
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_failed`)
    }
  }

  // URL to redirect to after sign in process completes
  // For OAuth users without pending plans, go to dashboard with welcome message
  return NextResponse.redirect(`${requestUrl.origin}/user-dashboard?welcome=true`)
} 