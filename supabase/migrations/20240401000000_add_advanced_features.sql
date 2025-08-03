-- Advanced Features Migration
-- Adds tables and functions for automated ad placement, cross-promotion matching, 
-- advanced analytics, and other partially implemented features

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ad placement tracking tables
CREATE TABLE IF NOT EXISTS ad_placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  newsletter_id UUID NOT NULL,
  ad_id UUID NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('sponsored', 'cross-promotion')),
  placement_position INTEGER NOT NULL,
  placement_confidence DECIMAL(3,2) DEFAULT 0.5,
  estimated_impressions INTEGER DEFAULT 0,
  actual_impressions INTEGER DEFAULT 0,
  actual_clicks INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ad_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  max_ads_per_newsletter INTEGER DEFAULT 3,
  preferred_ad_types TEXT[] DEFAULT ARRAY['sponsored', 'cross-promotion'],
  minimum_content_between_ads INTEGER DEFAULT 200,
  ad_placement_strategy TEXT DEFAULT 'balanced' CHECK (ad_placement_strategy IN ('aggressive', 'balanced', 'conservative')),
  auto_placement_enabled BOOLEAN DEFAULT true
);

-- Cross-promotion matching and campaigns
CREATE TABLE IF NOT EXISTS cross_promotion_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_newsletter_id UUID NOT NULL,
  target_newsletter_id UUID NOT NULL,
  compatibility_score DECIMAL(3,2) NOT NULL,
  matching_reasons TEXT[] DEFAULT ARRAY[]::TEXT[],
  duration_days INTEGER DEFAULT 30,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  estimated_reach INTEGER DEFAULT 0,
  estimated_revenue DECIMAL(10,2) DEFAULT 0,
  actual_reach INTEGER DEFAULT 0,
  actual_clicks INTEGER DEFAULT 0,
  actual_conversions INTEGER DEFAULT 0,
  actual_revenue DECIMAL(10,2) DEFAULT 0
);

-- Advanced subscription analytics tables
CREATE TABLE IF NOT EXISTS subscription_cancellations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL,
  reason TEXT,
  feedback TEXT,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5)
);

CREATE TABLE IF NOT EXISTS subscription_revenue_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  new_subscriptions INTEGER DEFAULT 0,
  cancelled_subscriptions INTEGER DEFAULT 0,
  UNIQUE(date, user_id)
);

-- Affiliate program enhancements
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_commission DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  net_payout DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_method TEXT,
  payout_details JSONB,
  processed_at TIMESTAMPTZ
);

-- Digital product delivery system
CREATE TABLE IF NOT EXISTS digital_product_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  product_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  delivery_method TEXT DEFAULT 'email' CHECK (delivery_method IN ('email', 'download', 'course_access')),
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'expired')),
  download_link TEXT,
  access_expires_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 3
);

-- Donation goals and recognition
CREATE TABLE IF NOT EXISTS donation_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private'))
);

CREATE TABLE IF NOT EXISTS donation_recognitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  donation_id UUID NOT NULL,
  recognition_type TEXT NOT NULL CHECK (recognition_type IN ('public_thanks', 'newsletter_mention', 'special_badge')),
  content TEXT,
  displayed_at TIMESTAMPTZ
);

-- Advanced email analytics
CREATE TABLE IF NOT EXISTS email_engagement_detailed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  newsletter_id UUID NOT NULL,
  subscriber_email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'unsubscribed', 'complained')),
  event_data JSONB,
  user_agent TEXT,
  ip_address INET,
  geolocation JSONB
);

-- Content moderation for platform admin
CREATE TABLE IF NOT EXISTS content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  content_type TEXT NOT NULL CHECK (content_type IN ('newsletter', 'ad', 'user_profile', 'comment')),
  content_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'requires_changes')),
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  automated_flags JSONB,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- System settings for platform configuration
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false
);

-- A/B testing framework
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL CHECK (test_type IN ('email_subject', 'email_content', 'landing_page', 'pricing')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  traffic_split DECIMAL(3,2) DEFAULT 0.5,
  success_metric TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ab_test_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('a', 'b')),
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(10,2) DEFAULT 0,
  UNIQUE(test_id, user_id)
);

-- Newsletter performance predictions
CREATE TABLE IF NOT EXISTS newsletter_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  newsletter_id UUID NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('open_rate', 'click_rate', 'revenue', 'growth')),
  predicted_value DECIMAL(10,4) NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  model_version TEXT,
  features_used JSONB,
  actual_value DECIMAL(10,4),
  prediction_accuracy DECIMAL(3,2)
);

-- Automated billing for subscriptions
CREATE TABLE IF NOT EXISTS subscription_billing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'renewed', 'failed', 'cancelled', 'refunded')),
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  payment_method_id TEXT,
  external_transaction_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  failure_reason TEXT,
  next_retry_at TIMESTAMPTZ,
  metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ad_placements_newsletter_id ON ad_placements(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_ad_placements_ad_id ON ad_placements(ad_id);
CREATE INDEX IF NOT EXISTS idx_cross_promotion_campaigns_source ON cross_promotion_campaigns(source_newsletter_id);
CREATE INDEX IF NOT EXISTS idx_cross_promotion_campaigns_target ON cross_promotion_campaigns(target_newsletter_id);
CREATE INDEX IF NOT EXISTS idx_cross_promotion_campaigns_status ON cross_promotion_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_subscription_revenue_daily_user_date ON subscription_revenue_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_email_engagement_newsletter_id ON email_engagement_detailed(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_email_engagement_subscriber ON email_engagement_detailed(subscriber_email);
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON content_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_ab_test_participants_test_id ON ab_test_participants(test_id);

-- Functions for automated calculations

-- Function to calculate user's current balance across all monetization streams
CREATE OR REPLACE FUNCTION calculate_user_balance(user_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_revenue DECIMAL(10,2) := 0;
    platform_fees DECIMAL(10,2) := 0;
    total_paid_out DECIMAL(10,2) := 0;
    fees RECORD;
BEGIN
    -- Get platform fees configuration (with defaults)
    SELECT 
        COALESCE(sponsored_ads_fee, 20) as sponsored_ads_fee,
        COALESCE(cross_promotions_fee, 20) as cross_promotions_fee,
        COALESCE(subscription_tiers_fee, 20) as subscription_tiers_fee,
        COALESCE(donations_fee, 20) as donations_fee,
        COALESCE(digital_products_fee, 20) as digital_products_fee,
        COALESCE(affiliate_program_fee, 20) as affiliate_program_fee
    INTO fees
    FROM platform_fees WHERE user_id = user_uuid
    UNION ALL
    SELECT 20, 20, 20, 20, 20, 20 -- Default values
    LIMIT 1;

    -- Calculate total revenue from all streams
    SELECT
        COALESCE(SUM(revenue), 0) INTO total_revenue
    FROM (
        SELECT COALESCE(SUM(revenue), 0) as revenue FROM sponsored_ads WHERE user_id = user_uuid
        UNION ALL
        SELECT COALESCE(SUM(revenue), 0) as revenue FROM cross_promotions WHERE user_id = user_uuid
        UNION ALL
        SELECT COALESCE(SUM(revenue), 0) as revenue FROM subscription_tiers WHERE user_id = user_uuid
        UNION ALL
        SELECT COALESCE(SUM(amount), 0) as revenue FROM donations WHERE user_id = user_uuid
        UNION ALL
        SELECT COALESCE(SUM(revenue), 0) as revenue FROM digital_products WHERE user_id = user_uuid
        UNION ALL
        SELECT COALESCE(SUM(revenue), 0) as revenue FROM affiliate_links WHERE user_id = user_uuid
    ) AS all_revenue;

    -- Calculate platform fees
    platform_fees := (
        (SELECT COALESCE(SUM(revenue), 0) FROM sponsored_ads WHERE user_id = user_uuid) * fees.sponsored_ads_fee / 100 +
        (SELECT COALESCE(SUM(revenue), 0) FROM cross_promotions WHERE user_id = user_uuid) * fees.cross_promotions_fee / 100 +
        (SELECT COALESCE(SUM(revenue), 0) FROM subscription_tiers WHERE user_id = user_uuid) * fees.subscription_tiers_fee / 100 +
        (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE user_id = user_uuid) * fees.donations_fee / 100 +
        (SELECT COALESCE(SUM(revenue), 0) FROM digital_products WHERE user_id = user_uuid) * fees.digital_products_fee / 100 +
        (SELECT COALESCE(SUM(revenue), 0) FROM affiliate_links WHERE user_id = user_uuid) * fees.affiliate_program_fee / 100
    );

    -- Get total paid out amount
    SELECT COALESCE(SUM(amount), 0) INTO total_paid_out
    FROM payouts
    WHERE user_id = user_uuid AND status = 'completed';

    -- Return available balance
    RETURN total_revenue - platform_fees - total_paid_out;
END;
$$ LANGUAGE plpgsql;

-- Function to update subscription revenue daily
CREATE OR REPLACE FUNCTION update_subscription_revenue_daily()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update daily revenue record
    INSERT INTO subscription_revenue_daily (date, user_id, revenue, subscriber_count, new_subscriptions, cancelled_subscriptions)
    VALUES (
        CURRENT_DATE,
        NEW.creator_id,
        NEW.amount,
        1,
        CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE 0 END,
        CASE WHEN TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'cancelled') THEN 1 ELSE 0 END
    )
    ON CONFLICT (date, user_id)
    DO UPDATE SET
        revenue = subscription_revenue_daily.revenue + 
            CASE 
                WHEN TG_OP = 'INSERT' THEN NEW.amount
                WHEN TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN -NEW.amount
                WHEN TG_OP = 'UPDATE' AND OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN NEW.amount
                ELSE 0
            END,
        subscriber_count = subscription_revenue_daily.subscriber_count +
            CASE
                WHEN TG_OP = 'INSERT' THEN 1
                WHEN TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN -1
                WHEN TG_OP = 'UPDATE' AND OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN 1
                ELSE 0
            END,
        new_subscriptions = subscription_revenue_daily.new_subscriptions +
            CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE 0 END,
        cancelled_subscriptions = subscription_revenue_daily.cancelled_subscriptions +
            CASE WHEN TG_OP = 'UPDATE' AND NEW.status = 'cancelled' THEN 1 ELSE 0 END;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to automatically process digital product deliveries
CREATE OR REPLACE FUNCTION process_digital_product_delivery()
RETURNS TRIGGER AS $$
DECLARE
    product RECORD;
    delivery_id UUID;
BEGIN
    -- Get product details
    SELECT * INTO product FROM digital_products WHERE id = NEW.product_id;
    
    -- Create delivery record
    INSERT INTO digital_product_deliveries (
        product_id,
        customer_email,
        delivery_method,
        delivery_status,
        download_link,
        access_expires_at,
        max_downloads
    )
    VALUES (
        NEW.product_id,
        NEW.customer_email,
        CASE 
            WHEN product.type = 'course' THEN 'course_access'
            WHEN product.type = 'download' THEN 'download'
            ELSE 'email'
        END,
        'pending',
        CASE 
            WHEN product.type = 'download' THEN '/api/products/download/' || NEW.product_id || '/' || gen_random_uuid()
            ELSE NULL
        END,
        CASE 
            WHEN product.type = 'course' THEN NOW() + INTERVAL '1 year'
            WHEN product.type = 'download' THEN NOW() + INTERVAL '30 days'
            ELSE NULL
        END,
        CASE 
            WHEN product.type = 'download' THEN 3
            ELSE NULL
        END
    )
    RETURNING id INTO delivery_id;

    -- Update product sales count
    UPDATE digital_products 
    SET sales = sales + 1,
        revenue = revenue + NEW.amount
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER subscription_revenue_daily_trigger
    AFTER INSERT OR UPDATE OR DELETE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_revenue_daily();

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, description, category, is_public) VALUES
('max_newsletters_per_user', '10', 'Maximum number of newsletters a user can create', 'limits', false),
('max_subscribers_free_tier', '1000', 'Maximum subscribers for free tier users', 'limits', true),
('platform_commission_rate', '0.1', 'Platform commission rate (10%)', 'monetization', false),
('email_sending_rate_limit', '1000', 'Maximum emails per hour per user', 'email', false),
('auto_moderation_enabled', 'true', 'Enable automatic content moderation', 'moderation', false),
('maintenance_mode', 'false', 'Platform maintenance mode', 'system', true),
('feature_flags', '{"ab_testing": true, "advanced_analytics": true, "auto_ad_placement": true}', 'Feature flags for platform features', 'features', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Create default ad preferences for existing users
INSERT INTO ad_preferences (user_id, max_ads_per_newsletter, preferred_ad_types, minimum_content_between_ads, ad_placement_strategy, auto_placement_enabled)
SELECT 
    id,
    3,
    ARRAY['sponsored', 'cross-promotion'],
    200,
    'balanced',
    true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM ad_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING; 