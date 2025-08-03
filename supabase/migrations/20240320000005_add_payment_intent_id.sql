-- Add payment_intent_id to donations table for Stripe integration
ALTER TABLE donations ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_donations_payment_intent_id ON donations(payment_intent_id);

-- Add metadata column for storing additional payment information
ALTER TABLE donations ADD COLUMN IF NOT EXISTS metadata JSONB; 