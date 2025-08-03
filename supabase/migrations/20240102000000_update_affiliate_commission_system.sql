-- Update affiliate commission system for recurring platform subscription commissions
-- This migration updates the affiliate system to track recurring commissions based on referred users' platform subscriptions

-- Add new columns to affiliate_referrals table for recurring tracking
ALTER TABLE affiliate_referrals 
ADD COLUMN IF NOT EXISTS subscription_id UUID,
ADD COLUMN IF NOT EXISTS monthly_commission DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_commission_paid DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_commission_date DATE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Create affiliate_commission_payments table to track monthly recurring payments
CREATE TABLE IF NOT EXISTS affiliate_commission_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  referral_id UUID NOT NULL,
  affiliate_user_id UUID NOT NULL,
  subscription_id UUID,
  commission_amount DECIMAL(10,2) NOT NULL,
  subscription_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,4) DEFAULT 0.20,
  payment_period_start DATE NOT NULL,
  payment_period_end DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'failed')),
  processed_at TIMESTAMPTZ,
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_subscription_id ON affiliate_referrals(subscription_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_subscription_status ON affiliate_referrals(subscription_status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commission_payments_referral_id ON affiliate_commission_payments(referral_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commission_payments_affiliate_user_id ON affiliate_commission_payments(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commission_payments_status ON affiliate_commission_payments(status);

-- Create RLS policies for affiliate_commission_payments
ALTER TABLE affiliate_commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own commission payments"
  ON affiliate_commission_payments FOR SELECT
  USING (auth.uid() = affiliate_user_id);

-- Function to calculate monthly affiliate commissions
CREATE OR REPLACE FUNCTION calculate_monthly_affiliate_commissions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    referral_record RECORD;
    commission_amount DECIMAL(10,2);
    current_month_start DATE;
    current_month_end DATE;
BEGIN
    current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    current_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    FOR referral_record IN
        SELECT 
            ar.id as referral_id,
            ar.user_id as affiliate_user_id,
            ar.subscription_id,
            ar.amount as subscription_amount
        FROM affiliate_referrals ar
        WHERE ar.is_recurring = true 
        AND ar.subscription_status = 'active'
        AND (ar.last_commission_date IS NULL OR ar.last_commission_date < current_month_start)
    LOOP
        commission_amount := referral_record.subscription_amount * 0.20;
        
        IF NOT EXISTS (
            SELECT 1 FROM affiliate_commission_payments 
            WHERE referral_id = referral_record.referral_id 
            AND payment_period_start = current_month_start
        ) THEN
            INSERT INTO affiliate_commission_payments (
                referral_id,
                affiliate_user_id,
                subscription_id,
                commission_amount,
                subscription_amount,
                payment_period_start,
                payment_period_end
            ) VALUES (
                referral_record.referral_id,
                referral_record.affiliate_user_id,
                referral_record.subscription_id,
                commission_amount,
                referral_record.subscription_amount,
                current_month_start,
                current_month_end
            );
            
            UPDATE affiliate_referrals 
            SET 
                monthly_commission = commission_amount,
                total_commission_paid = total_commission_paid + commission_amount,
                last_commission_date = current_month_start
            WHERE id = referral_record.referral_id;
        END IF;
    END LOOP;
END;
$$;

-- Function to handle subscription cancellations
CREATE OR REPLACE FUNCTION handle_subscription_cancellation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update affiliate referral status when subscription is cancelled
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE affiliate_referrals 
        SET subscription_status = 'cancelled'
        WHERE subscription_id = NEW.id;
    END IF;
    
    -- Reactivate affiliate referral when subscription is reactivated
    IF NEW.status = 'active' AND OLD.status = 'cancelled' THEN
        UPDATE affiliate_referrals 
        SET subscription_status = 'active'
        WHERE subscription_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription status changes
DROP TRIGGER IF EXISTS subscription_status_change_trigger ON subscriptions;
CREATE TRIGGER subscription_status_change_trigger
    AFTER UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_subscription_cancellation();

-- Function to create affiliate referral when user subscribes via referral link
CREATE OR REPLACE FUNCTION create_affiliate_referral(
    referred_user_id UUID,
    affiliate_code TEXT,
    subscription_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    affiliate_user_id UUID;
    referral_id UUID;
    subscription_amount DECIMAL(10,2);
BEGIN
    -- Find affiliate user by code
    SELECT user_id INTO affiliate_user_id
    FROM affiliate_links
    WHERE code = affiliate_code;
    
    IF affiliate_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid affiliate code: %', affiliate_code;
    END IF;
    
    -- Get subscription amount
    SELECT amount INTO subscription_amount
    FROM subscriptions
    WHERE id = subscription_id;
    
    -- Create affiliate referral record
    INSERT INTO affiliate_referrals (
        user_id,
        referred_user,
        plan,
        amount,
        commission,
        status,
        link_id,
        subscription_id,
        monthly_commission,
        is_recurring,
        subscription_status
    )
    SELECT 
        affiliate_user_id,
        referred_user_id::TEXT,
        'platform_subscription',
        subscription_amount,
        subscription_amount * 0.20, -- Initial commission calculation
        'active',
        al.id,
        subscription_id,
        subscription_amount * 0.20,
        true,
        'active'
    FROM affiliate_links al
    WHERE al.user_id = affiliate_user_id AND al.code = affiliate_code
    RETURNING id INTO referral_id;
    
    -- Update affiliate link stats
    UPDATE affiliate_links 
    SET conversions = conversions + 1,
        revenue = revenue + (subscription_amount * 0.20)
    WHERE user_id = affiliate_user_id AND code = affiliate_code;
    
    RETURN referral_id;
END;
$$;

-- Update trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to affiliate_commission_payments
CREATE TRIGGER update_affiliate_commission_payments_updated_at
  BEFORE UPDATE ON affiliate_commission_payments
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column(); 