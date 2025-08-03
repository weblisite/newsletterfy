-- Create user roles table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payout status logs table
CREATE TABLE IF NOT EXISTS payout_status_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payout_id UUID REFERENCES payouts(id) ON DELETE CASCADE,
    previous_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    notes TEXT,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles(role);
CREATE INDEX IF NOT EXISTS payout_status_logs_payout_id_idx ON payout_status_logs(payout_id);
CREATE INDEX IF NOT EXISTS payout_status_logs_admin_id_idx ON payout_status_logs(admin_id);

-- Add admin_notes column to payouts table if it doesn't exist
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_status_logs ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
CREATE POLICY "Public users can view their own role"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage user roles"
    ON user_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policies for payout_status_logs
CREATE POLICY "Users can view their own payout logs"
    ON payout_status_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM payouts
            WHERE payouts.id = payout_id
            AND payouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Only admins can create payout logs"
    ON payout_status_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$;

-- Update payouts policies to allow admin access
CREATE POLICY "Admins can view all payouts"
    ON payouts FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can update payouts"
    ON payouts FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin()); 