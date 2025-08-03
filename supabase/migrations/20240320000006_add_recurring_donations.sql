-- Add recurring donation support
CREATE TABLE IF NOT EXISTS recurring_donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  donation_tier_id UUID REFERENCES donation_tiers(id) ON DELETE SET NULL,
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

-- Add recurring donation tracking to donations table
ALTER TABLE donations ADD COLUMN IF NOT EXISTS recurring_donation_id UUID REFERENCES recurring_donations(id) ON DELETE SET NULL;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_donations_recipient_id ON recurring_donations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_donor_id ON recurring_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_status ON recurring_donations(status);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_next_payment ON recurring_donations(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_donations_recurring_id ON donations(recurring_donation_id);

-- Function to calculate next payment date
CREATE OR REPLACE FUNCTION calculate_next_payment_date(frequency TEXT, current_date TIMESTAMPTZ DEFAULT NOW())
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN CASE frequency
    WHEN 'weekly' THEN current_date + INTERVAL '1 week'
    WHEN 'monthly' THEN current_date + INTERVAL '1 month'
    WHEN 'quarterly' THEN current_date + INTERVAL '3 months'
    WHEN 'yearly' THEN current_date + INTERVAL '1 year'
    ELSE current_date + INTERVAL '1 month'
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to process recurring donation payment
CREATE OR REPLACE FUNCTION process_recurring_payment(
  p_recurring_donation_id UUID,
  p_amount DECIMAL,
  p_payment_intent_id TEXT DEFAULT NULL
)
RETURNS TABLE (donation_id UUID, success BOOLEAN, message TEXT) AS $$
DECLARE
  v_recurring_donation recurring_donations%ROWTYPE;
  v_donation_id UUID;
  v_user_share DECIMAL;
  v_platform_fee DECIMAL;
BEGIN
  -- Get recurring donation details
  SELECT * INTO v_recurring_donation 
  FROM recurring_donations 
  WHERE id = p_recurring_donation_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Recurring donation not found';
    RETURN;
  END IF;
  
  -- Calculate shares
  v_user_share := p_amount * 0.8;
  v_platform_fee := p_amount * 0.2;
  
  -- Create donation record
  INSERT INTO donations (
    donor_id,
    recipient_id,
    donation_tier_id,
    recurring_donation_id,
    amount,
    user_share,
    platform_fee,
    message,
    status,
    is_recurring,
    payment_intent_id
  )
  VALUES (
    v_recurring_donation.donor_id,
    v_recurring_donation.recipient_id,
    v_recurring_donation.donation_tier_id,
    p_recurring_donation_id,
    p_amount,
    v_user_share,
    v_platform_fee,
    v_recurring_donation.message,
    'completed',
    TRUE,
    p_payment_intent_id
  )
  RETURNING id INTO v_donation_id;
  
  -- Update recurring donation stats
  UPDATE recurring_donations 
  SET 
    last_payment_date = NOW(),
    next_payment_date = calculate_next_payment_date(frequency),
    total_payments = total_payments + 1,
    total_amount = total_amount + p_amount,
    failure_count = 0,
    updated_at = NOW()
  WHERE id = p_recurring_donation_id;
  
  -- Update recipient stats
  PERFORM update_user_donation_stats(v_recurring_donation.recipient_id, p_amount);
  
  RETURN QUERY SELECT v_donation_id, TRUE, 'Recurring payment processed successfully';
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::UUID, FALSE, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to handle failed recurring payments
CREATE OR REPLACE FUNCTION handle_recurring_payment_failure(
  p_recurring_donation_id UUID,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_failure_count INTEGER;
BEGIN
  -- Increment failure count
  UPDATE recurring_donations 
  SET 
    failure_count = failure_count + 1,
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'last_failure_date', NOW(),
      'last_failure_reason', p_error_message
    )
  WHERE id = p_recurring_donation_id
  RETURNING failure_count INTO v_failure_count;
  
  -- Cancel if too many failures (after 3 attempts)
  IF v_failure_count >= 3 THEN
    UPDATE recurring_donations 
    SET 
      status = 'failed',
      updated_at = NOW()
    WHERE id = p_recurring_donation_id;
    
    RETURN FALSE; -- Subscription cancelled
  END IF;
  
  RETURN TRUE; -- Still active, will retry
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE recurring_donations ENABLE ROW LEVEL SECURITY;

-- Users can view their own recurring donations (as recipients)
CREATE POLICY "Users can view recurring donations to them"
  ON recurring_donations FOR SELECT
  USING (auth.uid() = recipient_id);

-- Users can view recurring donations they made (as donors)
CREATE POLICY "Users can view their own recurring donations"
  ON recurring_donations FOR SELECT
  USING (auth.uid() = donor_id);

-- Users can create recurring donations
CREATE POLICY "Users can create recurring donations"
  ON recurring_donations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

-- Users can update their own recurring donations (pause/cancel)
CREATE POLICY "Users can update their recurring donations"
  ON recurring_donations FOR UPDATE
  USING (auth.uid() = donor_id OR auth.uid() = recipient_id);

-- Trigger to update updated_at
CREATE TRIGGER update_recurring_donations_updated_at
  BEFORE UPDATE ON recurring_donations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column(); 