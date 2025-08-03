-- Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payout_method VARCHAR(50) NOT NULL,
    payment_details JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS payouts_user_id_idx ON payouts(user_id);
CREATE INDEX IF NOT EXISTS payouts_status_idx ON payouts(status);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own payouts
CREATE POLICY "Users can view their own payouts"
    ON payouts FOR SELECT
    USING (auth.uid() = user_id);

-- Users can request payouts
CREATE POLICY "Users can request payouts"
    ON payouts FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND status = 'pending'
    );

-- Users can cancel their pending payouts
CREATE POLICY "Users can cancel their pending payouts"
    ON payouts FOR DELETE
    USING (
        auth.uid() = user_id
        AND status = 'pending'
    );

-- Only service role can update payout status
CREATE POLICY "Service role can update payout status"
    ON payouts FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role'); 