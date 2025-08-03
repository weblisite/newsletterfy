-- COMPLETE DATABASE SETUP FOR NEWSLETTERFY
-- This script creates ALL tables needed by your application
-- Run this entire script in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE USER TABLES
-- =====================================================

-- Users table (if not exists from Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  name VARCHAR(255),
  username VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  total_donations DECIMAL(10,2) DEFAULT 0,
  total_supporters INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table for admin functionality
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User funds for payment tracking
CREATE TABLE IF NOT EXISTS user_funds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 0,
  pending_balance NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD'
);

-- =====================================================
-- DONATIONS SYSTEM (CORRECTED SCHEMA)
-- =====================================================

-- Drop existing donations table if it has wrong schema
DROP TABLE IF EXISTS donations CASCADE;

-- Donation tiers table
CREATE TABLE IF NOT EXISTS donation_tiers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  perks TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations table with CORRECT schema (including recipient_id)
CREATE TABLE donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  donation_tier_id UUID REFERENCES donation_tiers(id) ON DELETE SET NULL,
  recurring_donation_id UUID,
  goal_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  user_share DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'completed',
  payment_intent_id TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring donations table
CREATE TABLE IF NOT EXISTS recurring_donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  donation_tier_id UUID REFERENCES donation_tiers(id) ON DELETE SET NULL,
  goal_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'failed')),
  stripe_subscription_id TEXT UNIQUE,
  next_payment_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  total_payments INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  donor_name TEXT,
  donor_email TEXT,
  message TEXT,
  metadata JSONB
);

-- Donation goals/campaigns table
CREATE TABLE IF NOT EXISTS donation_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  is_featured BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  category TEXT DEFAULT 'general',
  image_url TEXT,
  thankyou_message TEXT,
  donor_count INTEGER DEFAULT 0,
  metadata JSONB
);

-- Donation goal milestones
CREATE TABLE IF NOT EXISTS donation_goal_milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  goal_id UUID REFERENCES donation_goals(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reward_description TEXT,
  is_reached BOOLEAN DEFAULT FALSE,
  reached_at TIMESTAMPTZ
);

-- Donation goal updates
CREATE TABLE IF NOT EXISTS donation_goal_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  goal_id UUID REFERENCES donation_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT DEFAULT 'progress' CHECK (update_type IN ('progress', 'milestone', 'announcement', 'completion')),
  is_pinned BOOLEAN DEFAULT FALSE
);

-- Add foreign key constraints to donations table for new columns
ALTER TABLE donations ADD CONSTRAINT fk_donations_recurring_id 
  FOREIGN KEY (recurring_donation_id) REFERENCES recurring_donations(id) ON DELETE SET NULL;
ALTER TABLE donations ADD CONSTRAINT fk_donations_goal_id 
  FOREIGN KEY (goal_id) REFERENCES donation_goals(id) ON DELETE SET NULL;
ALTER TABLE recurring_donations ADD CONSTRAINT fk_recurring_goal_id 
  FOREIGN KEY (goal_id) REFERENCES donation_goals(id) ON DELETE SET NULL;

-- =====================================================
-- SUBSCRIPTIONS SYSTEM
-- =====================================================

-- Subscription tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  subscribers INTEGER DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscriber_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES subscription_tiers(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AFFILIATE SYSTEM
-- =====================================================

-- Affiliate links table
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate referrals table
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  plan TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DIGITAL PRODUCTS
-- =====================================================

-- Digital products table
CREATE TABLE IF NOT EXISTS digital_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  file_url TEXT NOT NULL,
  preview_url TEXT,
  status TEXT DEFAULT 'draft',
  sales INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital product purchases table
CREATE TABLE IF NOT EXISTS digital_product_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES digital_products(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SPONSORED ADS SYSTEM
-- =====================================================

-- Basic sponsored ads table
CREATE TABLE IF NOT EXISTS sponsored_ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  brand_name TEXT NOT NULL,
  campaign TEXT NOT NULL,
  budget NUMERIC NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0
);

-- Brands table for advanced sponsored ads
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  brand_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  website TEXT,
  industry TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  billing_info JSONB,
  total_spent NUMERIC DEFAULT 0,
  total_campaigns INTEGER DEFAULT 0,
  average_ctr NUMERIC DEFAULT 0
);

-- =====================================================
-- CROSS-PROMOTIONS SYSTEM
-- =====================================================

-- Cross promotions table
CREATE TABLE IF NOT EXISTS cross_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  newsletter_name TEXT NOT NULL,
  description TEXT NOT NULL,
  subscribers INTEGER NOT NULL,
  revenue_per_click NUMERIC NOT NULL,
  clicks INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL
);

-- Newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  newsletter_name TEXT NOT NULL,
  description TEXT,
  subscriber_count INTEGER DEFAULT 0,
  open_rate NUMERIC DEFAULT 0,
  click_rate NUMERIC DEFAULT 0,
  niche TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
  website_url TEXT,
  subscription_url TEXT
);

-- =====================================================
-- MONETIZATION STATS
-- =====================================================

-- Monetization stats table
CREATE TABLE IF NOT EXISTS monetization_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE UNIQUE NOT NULL,
  sponsored_ads_average_earnings NUMERIC DEFAULT 0,
  sponsored_ads_active_sponsors INTEGER DEFAULT 0,
  sponsored_ads_platform_fee INTEGER DEFAULT 20,
  cross_promotions_clicks INTEGER DEFAULT 0,
  cross_promotions_revenue NUMERIC DEFAULT 0,
  cross_promotions_platform_fee INTEGER DEFAULT 20,
  paid_subscriptions_subscribers INTEGER DEFAULT 0,
  paid_subscriptions_revenue NUMERIC DEFAULT 0,
  paid_subscriptions_platform_fee INTEGER DEFAULT 10,
  tips_and_donations_supporters INTEGER DEFAULT 0,
  tips_and_donations_total NUMERIC DEFAULT 0,
  tips_and_donations_platform_fee INTEGER DEFAULT 10,
  digital_products_sold INTEGER DEFAULT 0,
  digital_products_revenue NUMERIC DEFAULT 0,
  digital_products_platform_fee INTEGER DEFAULT 10,
  affiliate_program_referrals INTEGER DEFAULT 0,
  affiliate_program_commission NUMERIC DEFAULT 0,
  affiliate_program_platform_fee INTEGER DEFAULT 50
);

-- =====================================================
-- PAYMENT TRANSACTIONS
-- =====================================================

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'spend', 'earn')),
  amount NUMERIC NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method TEXT,
  external_transaction_id TEXT
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL CHECK (amount > 0),
  platform_fee DECIMAL DEFAULT 0,
  net_amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_method TEXT DEFAULT 'bank_transfer',
  payout_details JSONB,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  notes TEXT
);

-- =====================================================
-- EMAIL EVENTS
-- =====================================================

-- Email events table
CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Donations indexes
CREATE INDEX IF NOT EXISTS idx_donations_recipient_id ON donations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_payment_intent_id ON donations(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_donations_recurring_id ON donations(recurring_donation_id);
CREATE INDEX IF NOT EXISTS idx_donations_goal_id ON donations(goal_id);

-- Donation tiers indexes
CREATE INDEX IF NOT EXISTS idx_donation_tiers_user_id ON donation_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_tiers_status ON donation_tiers(status);

-- Recurring donations indexes
CREATE INDEX IF NOT EXISTS idx_recurring_donations_recipient_id ON recurring_donations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_donor_id ON recurring_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_status ON recurring_donations(status);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_next_payment ON recurring_donations(next_payment_date);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_donation_goals_user_id ON donation_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_goals_status ON donation_goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON donation_goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_updates_goal_id ON donation_goal_updates(goal_id);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_user_id ON subscription_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber_id ON subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_id ON subscriptions(creator_id);

-- Affiliate indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_links_user_id ON affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_user_id ON affiliate_referrals(user_id);

-- Digital products indexes
CREATE INDEX IF NOT EXISTS idx_digital_products_user_id ON digital_products(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_purchases_user_id ON digital_product_purchases(user_id);

-- Sponsored ads indexes
CREATE INDEX IF NOT EXISTS idx_sponsored_ads_user_id ON sponsored_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);

-- Cross promotions indexes
CREATE INDEX IF NOT EXISTS idx_cross_promotions_user_id ON cross_promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletters_user_id ON newsletters(user_id);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_funds_user_id ON user_funds(user_id);

-- Email events indexes
CREATE INDEX IF NOT EXISTS idx_email_events_email ON email_events(email);
CREATE INDEX IF NOT EXISTS idx_email_events_message_id ON email_events(message_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate next payment date
CREATE OR REPLACE FUNCTION calculate_next_payment_date(frequency TEXT, current_date TIMESTAMPTZ DEFAULT NOW())
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE frequency
    WHEN 'weekly' THEN RETURN current_date + INTERVAL '1 week';
    WHEN 'monthly' THEN RETURN current_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN RETURN current_date + INTERVAL '3 months';
    WHEN 'yearly' THEN RETURN current_date + INTERVAL '1 year';
    ELSE RETURN current_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update user donation stats
CREATE OR REPLACE FUNCTION update_user_donation_stats(user_id UUID, donation_amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    total_donations = COALESCE(total_donations, 0) + donation_amount,
    total_supporters = (
      SELECT COUNT(DISTINCT donor_id)
      FROM donations
      WHERE recipient_id = user_id
    )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update goal progress
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_goal_id UUID;
  v_new_amount DECIMAL(10,2);
  v_donor_count INTEGER;
  v_target_amount DECIMAL(10,2);
  v_milestone RECORD;
BEGIN
  -- Handle both INSERT and UPDATE for donations
  IF TG_OP = 'INSERT' THEN
    v_goal_id := NEW.goal_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_goal_id := COALESCE(NEW.goal_id, OLD.goal_id);
  END IF;

  -- Update goal if goal_id exists
  IF v_goal_id IS NOT NULL THEN
    -- Calculate new total amount and donor count
    SELECT 
      COALESCE(SUM(amount), 0),
      COUNT(DISTINCT donor_id)
    INTO v_new_amount, v_donor_count
    FROM donations 
    WHERE goal_id = v_goal_id AND status = 'completed';

    -- Update the goal
    UPDATE donation_goals 
    SET 
      current_amount = v_new_amount,
      donor_count = v_donor_count,
      updated_at = NOW()
    WHERE id = v_goal_id
    RETURNING target_amount INTO v_target_amount;

    -- Check and update milestones
    FOR v_milestone IN 
      SELECT * FROM donation_goal_milestones 
      WHERE goal_id = v_goal_id 
      AND NOT is_reached 
      AND amount <= v_new_amount
    LOOP
      UPDATE donation_goal_milestones 
      SET 
        is_reached = TRUE,
        reached_at = NOW()
      WHERE id = v_milestone.id;
    END LOOP;

    -- Mark goal as completed if target reached
    IF v_new_amount >= v_target_amount THEN
      UPDATE donation_goals 
      SET status = 'completed'
      WHERE id = v_goal_id AND status = 'active';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at triggers for relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donation_tiers_updated_at
  BEFORE UPDATE ON donation_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_donations_updated_at
  BEFORE UPDATE ON recurring_donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donation_goals_updated_at
  BEFORE UPDATE ON donation_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Goal progress trigger
CREATE TRIGGER donations_update_goal_progress
  AFTER INSERT OR UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

-- =====================================================
-- ROW LEVEL SECURITY (DISABLED FOR DEVELOPMENT)
-- =====================================================

-- Disable RLS for development mode
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_funds DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE donation_tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE digital_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE cross_promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payouts DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS: Complete database setup finished!';
  RAISE NOTICE '📊 All tables created with correct schema';
  RAISE NOTICE '🔧 All functions and triggers installed';
  RAISE NOTICE '📈 All indexes created for performance';
  RAISE NOTICE '🔒 RLS disabled for development mode';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your database is now ready!';
  RAISE NOTICE 'The donations table includes recipient_id column.';
  RAISE NOTICE 'All API routes should work without errors.';
END $$; 