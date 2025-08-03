-- Function to calculate available balance for a user
CREATE OR REPLACE FUNCTION calculate_available_balance(user_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
    total_revenue DECIMAL := 0;
    platform_fees DECIMAL := 0;
    total_paid_out DECIMAL := 0;
    fees RECORD;
BEGIN
    -- Get platform fees configuration
    SELECT * INTO fees FROM platform_fees WHERE user_id = $1;
    
    IF fees IS NULL THEN
        -- Use default fees if not configured
        fees := ROW(
            20.0, -- sponsored_ads_fee
            20.0, -- cross_promotions_fee
            20.0, -- subscription_tiers_fee
            20.0, -- donations_fee
            20.0, -- digital_products_fee
            20.0  -- affiliate_program_fee
        );
    END IF;

    -- Calculate total revenue from all streams
    -- Sponsored Ads
    SELECT COALESCE(SUM(revenue), 0) INTO total_revenue
    FROM sponsored_ads
    WHERE user_id = $1;

    -- Cross Promotions
    SELECT total_revenue + COALESCE(SUM(revenue), 0)
    INTO total_revenue
    FROM cross_promotions
    WHERE user_id = $1;

    -- Subscription Tiers
    SELECT total_revenue + COALESCE(SUM(revenue), 0)
    INTO total_revenue
    FROM subscription_tiers
    WHERE user_id = $1;

    -- Donations
    SELECT total_revenue + COALESCE(SUM(amount), 0)
    INTO total_revenue
    FROM donations
    WHERE user_id = $1;

    -- Digital Products
    SELECT total_revenue + COALESCE(SUM(revenue), 0)
    INTO total_revenue
    FROM digital_products
    WHERE user_id = $1;

    -- Affiliate Links
    SELECT total_revenue + COALESCE(SUM(revenue), 0)
    INTO total_revenue
    FROM affiliate_links
    WHERE user_id = $1;

    -- Calculate platform fees
    platform_fees := (
        (SELECT COALESCE(SUM(revenue), 0) FROM sponsored_ads WHERE user_id = $1) * fees.sponsored_ads_fee / 100 +
        (SELECT COALESCE(SUM(revenue), 0) FROM cross_promotions WHERE user_id = $1) * fees.cross_promotions_fee / 100 +
        (SELECT COALESCE(SUM(revenue), 0) FROM subscription_tiers WHERE user_id = $1) * fees.subscription_tiers_fee / 100 +
        (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE user_id = $1) * fees.donations_fee / 100 +
        (SELECT COALESCE(SUM(revenue), 0) FROM digital_products WHERE user_id = $1) * fees.digital_products_fee / 100 +
        (SELECT COALESCE(SUM(revenue), 0) FROM affiliate_links WHERE user_id = $1) * fees.affiliate_program_fee / 100
    );

    -- Get total paid out amount
    SELECT COALESCE(SUM(amount), 0) INTO total_paid_out
    FROM payouts
    WHERE user_id = $1 AND status = 'completed';

    -- Return available balance
    RETURN total_revenue - platform_fees - total_paid_out;
END;
$$; 