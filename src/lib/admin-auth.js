import { getSupabaseClient } from './auth-utils';

/**
 * Check if the current user has admin privileges
 * @returns {Promise<{isAdmin: boolean, session: object|null, error: Error|null}>}
 */
export async function checkAdminAuth() {
  try {
    const supabase = getSupabaseClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return { isAdmin: false, session: null, error: authError || new Error('No session') };
    }

    // Check if user has admin role in user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (roleError) {
      return { isAdmin: false, session, error: roleError };
    }

    const isAdmin = roleData?.role === 'admin';
    return { isAdmin, session, error: null };
  } catch (error) {
    return { isAdmin: false, session: null, error };
  }
} 