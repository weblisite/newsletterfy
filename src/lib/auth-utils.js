import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { supabase as supabaseClient } from './supabase';

const MOCK_USER = {
  id: 'dev-user-id',
  email: 'dev@example.com',
  role: 'admin',
  user_metadata: {
    full_name: 'Development User'
  }
};

const MOCK_SESSION = {
  user: MOCK_USER,
  session: {
    access_token: 'mock-token',
    expires_at: new Date().getTime() + 24 * 60 * 60 * 1000, // 24 hours from now
    refresh_token: 'mock-refresh-token',
    user: MOCK_USER
  }
};

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return supabaseClient;
  }
  return createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });
}

export async function checkAuth() {
  // Return mock session if auth is disabled
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    return {
      user: MOCK_USER,
      error: null,
      isAuthenticated: true
    };
  }

  const supabase = getSupabaseClient();
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    return {
      user: session?.user || null,
      error: null,
      isAuthenticated: !!session?.user
    };
  } catch (error) {
    console.error('Auth check failed:', error);
    return {
      user: null,
      error,
      isAuthenticated: false
    };
  }
}

// Helper to get session (mock if auth is disabled, real otherwise)
export async function getSession() {
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    return { data: MOCK_SESSION, error: null };
  }

  const supabase = getSupabaseClient();
  return supabase.auth.getSession();
}

// Helper to get current user
export async function getCurrentUser() {
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    return { data: { user: MOCK_USER }, error: null };
  }

  const supabase = getSupabaseClient();
  return supabase.auth.getUser();
} 