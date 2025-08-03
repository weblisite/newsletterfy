-- Function to update user donation statistics
CREATE OR REPLACE FUNCTION update_user_donation_stats(user_id UUID, donation_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  -- Update or insert donation statistics
  INSERT INTO user_stats (user_id, total_donations_received, total_donation_amount, unique_donors)
  VALUES (
    user_id, 
    1, 
    donation_amount,
    1
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_donations_received = COALESCE(user_stats.total_donations_received, 0) + 1,
    total_donation_amount = COALESCE(user_stats.total_donation_amount, 0) + donation_amount,
    updated_at = NOW();
    
  -- Update unique donors count (approximate)
  UPDATE user_stats 
  SET unique_donors = (
    SELECT COUNT(DISTINCT COALESCE(donor_id, (metadata->>'donor_email')::text))
    FROM donations 
    WHERE recipient_id = user_id AND status = 'completed'
  )
  WHERE user_stats.user_id = update_user_donation_stats.user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get donation analytics for a user
CREATE OR REPLACE FUNCTION get_donation_analytics(user_id UUID)
RETURNS TABLE (
  total_donations INTEGER,
  total_amount DECIMAL,
  total_user_share DECIMAL,
  unique_donors INTEGER,
  recent_donations JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(d.id)::INTEGER, 0) as total_donations,
    COALESCE(SUM(d.amount), 0) as total_amount,
    COALESCE(SUM(d.user_share), 0) as total_user_share,
    COALESCE(COUNT(DISTINCT COALESCE(d.donor_id, (d.metadata->>'donor_email')::text))::INTEGER, 0) as unique_donors,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'amount', d.amount,
          'message', d.message,
          'created_at', d.created_at,
          'donor_name', COALESCE(
            (SELECT name FROM users WHERE id = d.donor_id),
            (d.metadata->>'donor_name')::text
          )
        ) ORDER BY d.created_at DESC
      ) FILTER (WHERE d.id IS NOT NULL), 
      '[]'::jsonb
    ) as recent_donations
  FROM donations d
  WHERE d.recipient_id = get_donation_analytics.user_id 
    AND d.status = 'completed'
  GROUP BY d.recipient_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process donation and update related data
CREATE OR REPLACE FUNCTION process_donation(
  p_recipient_id UUID,
  p_amount DECIMAL,
  p_tier_id INTEGER DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_donor_name TEXT DEFAULT NULL,
  p_donor_email TEXT DEFAULT NULL,
  p_donor_id UUID DEFAULT NULL
)
RETURNS TABLE (donation_id UUID, success BOOLEAN, message TEXT) AS $$
DECLARE
  v_donation_id UUID;
  v_user_share DECIMAL;
  v_platform_fee DECIMAL;
BEGIN
  -- Calculate shares
  v_user_share := p_amount * 0.8;
  v_platform_fee := p_amount * 0.2;
  
  -- Insert donation
  INSERT INTO donations (
    donor_id,
    recipient_id,
    donation_tier_id,
    amount,
    user_share,
    platform_fee,
    message,
    status,
    metadata
  )
  VALUES (
    p_donor_id,
    p_recipient_id,
    p_tier_id,
    p_amount,
    v_user_share,
    v_platform_fee,
    p_message,
    'completed',
    CASE 
      WHEN p_donor_name IS NOT NULL OR p_donor_email IS NOT NULL 
      THEN jsonb_build_object(
        'donor_name', p_donor_name,
        'donor_email', p_donor_email
      )
      ELSE NULL
    END
  )
  RETURNING id INTO v_donation_id;
  
  -- Update donation statistics
  PERFORM update_user_donation_stats(p_recipient_id, p_amount);
  
  -- Update tier statistics if applicable
  IF p_tier_id IS NOT NULL THEN
    UPDATE donation_tiers 
    SET 
      total_donations = COALESCE(total_donations, 0) + 1,
      total_amount = COALESCE(total_amount, 0) + p_amount,
      updated_at = NOW()
    WHERE id = p_tier_id AND user_id = p_recipient_id;
  END IF;
  
  RETURN QUERY SELECT v_donation_id, TRUE, 'Donation processed successfully';
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::UUID, FALSE, SQLERRM;
END;
$$ LANGUAGE plpgsql; 