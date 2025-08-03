-- =============================================
-- Fix Missing Columns in Existing Tables
-- =============================================
-- This script safely adds missing columns to existing tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Fix donations table - add missing columns
DO $$
BEGIN
    -- Add recipient_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'recipient_id') THEN
        ALTER TABLE donations ADD COLUMN recipient_id UUID NOT NULL DEFAULT uuid_generate_v4();
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'status') THEN
        ALTER TABLE donations ADD COLUMN status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));
    END IF;
    
    -- Add message column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'message') THEN
        ALTER TABLE donations ADD COLUMN message TEXT;
    END IF;
    
    -- Add is_anonymous column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'is_anonymous') THEN
        ALTER TABLE donations ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
    END IF;
    
    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'payment_method') THEN
        ALTER TABLE donations ADD COLUMN payment_method VARCHAR(50);
    END IF;
    
    -- Add tier_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'tier_id') THEN
        ALTER TABLE donations ADD COLUMN tier_id UUID;
    END IF;
    
    -- Add goal_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'goal_id') THEN
        ALTER TABLE donations ADD COLUMN goal_id UUID;
    END IF;
    
    -- Add recurring_donation_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'recurring_donation_id') THEN
        ALTER TABLE donations ADD COLUMN recurring_donation_id UUID;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'updated_at') THEN
        ALTER TABLE donations ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Fix donation_tiers table - add missing columns
DO $$
BEGIN
    -- Check if table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'donation_tiers') THEN
        CREATE TABLE donation_tiers (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            creator_id UUID NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
            benefits TEXT[],
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        -- Add missing columns to existing table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donation_tiers' AND column_name = 'description') THEN
            ALTER TABLE donation_tiers ADD COLUMN description TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donation_tiers' AND column_name = 'benefits') THEN
            ALTER TABLE donation_tiers ADD COLUMN benefits TEXT[];
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donation_tiers' AND column_name = 'is_active') THEN
            ALTER TABLE donation_tiers ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donation_tiers' AND column_name = 'updated_at') THEN
            ALTER TABLE donation_tiers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
    END IF;
END $$;

-- Create donation_goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS donation_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_amount DECIMAL(10,2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(10,2) DEFAULT 0.00,
    deadline DATE,
    is_active BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create recurring_donations table if it doesn't exist
CREATE TABLE IF NOT EXISTS recurring_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
    next_payment_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create donation_goal_milestones table if it doesn't exist
CREATE TABLE IF NOT EXISTS donation_goal_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES donation_goals(id) ON DELETE CASCADE,
    milestone_amount DECIMAL(10,2) NOT NULL CHECK (milestone_amount > 0),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_reached BOOLEAN DEFAULT false,
    reached_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create donation_goal_updates table if it doesn't exist
CREATE TABLE IF NOT EXISTS donation_goal_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES donation_goals(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ADD FOREIGN KEY CONSTRAINTS SAFELY
-- =============================================

-- Add foreign key constraints to donations table if they don't exist
DO $$
BEGIN
    -- Add foreign key to donation_tiers if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'donations_tier_id_fkey' 
        AND table_name = 'donations'
    ) THEN
        ALTER TABLE donations 
        ADD CONSTRAINT donations_tier_id_fkey 
        FOREIGN KEY (tier_id) REFERENCES donation_tiers(id);
    END IF;
    
    -- Add foreign key to donation_goals if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'donations_goal_id_fkey' 
        AND table_name = 'donations'
    ) THEN
        ALTER TABLE donations 
        ADD CONSTRAINT donations_goal_id_fkey 
        FOREIGN KEY (goal_id) REFERENCES donation_goals(id);
    END IF;
    
    -- Add foreign key to recurring_donations if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'donations_recurring_donation_id_fkey' 
        AND table_name = 'donations'
    ) THEN
        ALTER TABLE donations 
        ADD CONSTRAINT donations_recurring_donation_id_fkey 
        FOREIGN KEY (recurring_donation_id) REFERENCES recurring_donations(id);
    END IF;
END $$;

-- =============================================
-- CREATE UTILITY FUNCTION
-- =============================================

-- Drop existing function if it exists and recreate
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- ADD TRIGGERS SAFELY
-- =============================================

-- Drop existing triggers first, then recreate
DROP TRIGGER IF EXISTS update_donations_updated_at ON donations;
DROP TRIGGER IF EXISTS update_donation_tiers_updated_at ON donation_tiers;
DROP TRIGGER IF EXISTS update_donation_goals_updated_at ON donation_goals;
DROP TRIGGER IF EXISTS update_recurring_donations_updated_at ON recurring_donations;

-- Create triggers
CREATE TRIGGER update_donations_updated_at
    BEFORE UPDATE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donation_tiers_updated_at
    BEFORE UPDATE ON donation_tiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donation_goals_updated_at
    BEFORE UPDATE ON donation_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_donations_updated_at
    BEFORE UPDATE ON recurring_donations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CREATE INDEXES
-- =============================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_donations_recipient_id ON donations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donation_tiers_creator_id ON donation_tiers(creator_id);
CREATE INDEX IF NOT EXISTS idx_donation_goals_creator_id ON donation_goals(creator_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_creator_id ON recurring_donations(creator_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_donor_id ON recurring_donations(donor_id);

-- =============================================
-- DISABLE RLS FOR DEVELOPMENT
-- =============================================

-- Disable RLS on all tables for development
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE donation_tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goal_milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goal_updates DISABLE ROW LEVEL SECURITY;

-- =============================================
-- SUCCESS NOTIFICATIONS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Missing columns have been added successfully!';
    RAISE NOTICE '🎯 The donations.recipient_id and status columns are now available!';
    RAISE NOTICE '🔧 Foreign key constraints have been added safely';
    RAISE NOTICE '⚡ Performance indexes have been created';
    RAISE NOTICE '🚀 Your donations system should now work properly!';
END $$; 