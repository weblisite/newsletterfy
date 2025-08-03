import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET settings
export async function GET(request) {
  try {
    // Get brand ID from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const brandId = session?.user?.id;
    if (!brandId) throw new Error('Brand ID not found');

    // Fetch brand settings from database
    const { data: settings, error: settingsError } = await supabase
      .from('brand_settings')
      .select('*')
      .eq('brand_id', brandId)
      .single();

    if (settingsError) throw settingsError;

    // Format the response
    const response = {
      profile: {
        name: settings.name,
        website: settings.website,
        logo: settings.logo_url,
        description: settings.description,
        industry: settings.industry,
        contactEmail: settings.contact_email,
        contactPhone: settings.contact_phone,
      },
      preferences: {
        emailNotifications: settings.email_notifications,
        autoRenewCampaigns: settings.auto_renew_campaigns,
        defaultBudget: settings.default_budget,
        targetNiches: settings.target_niches,
        preferredPaymentMethod: settings.preferred_payment_method,
      },
      security: {
        twoFactorEnabled: settings.two_factor_enabled,
        lastPasswordChange: settings.last_password_change,
        loginHistory: settings.login_history || [],
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// PUT settings
export async function PUT(request) {
  try {
    const body = await request.json();
    const { profile, preferences, security } = body;

    // Get brand ID from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const brandId = session?.user?.id;
    if (!brandId) throw new Error('Brand ID not found');

    // Update settings in database
    const { error: updateError } = await supabase
      .from('brand_settings')
      .update({
        name: profile?.name,
        website: profile?.website,
        logo_url: profile?.logo,
        description: profile?.description,
        industry: profile?.industry,
        contact_email: profile?.contactEmail,
        contact_phone: profile?.contactPhone,
        email_notifications: preferences?.emailNotifications,
        auto_renew_campaigns: preferences?.autoRenewCampaigns,
        default_budget: preferences?.defaultBudget,
        target_niches: preferences?.targetNiches,
        preferred_payment_method: preferences?.preferredPaymentMethod,
        two_factor_enabled: security?.twoFactorEnabled,
      })
      .eq('brand_id', brandId);

    if (updateError) throw updateError;

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
} 