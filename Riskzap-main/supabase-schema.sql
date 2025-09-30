-- RiskZap Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================== POLICIES TABLE ==================
CREATE TABLE IF NOT EXISTS policies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_wallet_address TEXT NOT NULL,
    policy_type TEXT NOT NULL,
    premium DECIMAL(18,8) NOT NULL,
    coverage DECIMAL(18,2) NOT NULL,
    duration INTEGER NOT NULL, -- in days
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'claimed')),
    claim_amount DECIMAL(18,8),
    claim_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policies_user_wallet ON policies(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_purchase_date ON policies(purchase_date);
CREATE INDEX IF NOT EXISTS idx_policies_policy_type ON policies(policy_type);

-- ================== ACTIVITIES TABLE ==================
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_wallet_address TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(18,8),
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    transaction_hash TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_user_wallet ON activities(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_activities_action ON activities(action);
CREATE INDEX IF NOT EXISTS idx_activities_policy_id ON activities(policy_id);

-- ================== CLAIM RECORDS TABLE ==================
CREATE TABLE IF NOT EXISTS claim_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    user_wallet_address TEXT NOT NULL,
    claim_amount DECIMAL(18,8) NOT NULL,
    claim_percentage DECIMAL(5,2) NOT NULL,
    days_held INTEGER NOT NULL,
    time_bonus DECIMAL(5,2) NOT NULL,
    claim_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for claim records
CREATE INDEX IF NOT EXISTS idx_claim_records_user_wallet ON claim_records(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_claim_records_policy_id ON claim_records(policy_id);
CREATE INDEX IF NOT EXISTS idx_claim_records_status ON claim_records(status);
CREATE INDEX IF NOT EXISTS idx_claim_records_claim_date ON claim_records(claim_date);

-- ================== FUNCTIONS FOR AUTO-UPDATING TIMESTAMPS ==================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_policies_updated_at 
    BEFORE UPDATE ON policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claim_records_updated_at 
    BEFORE UPDATE ON claim_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================== ROW LEVEL SECURITY (RLS) POLICIES ==================
-- Enable RLS on all tables
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_records ENABLE ROW LEVEL SECURITY;

-- Policies RLS: Users can only see their own policies
CREATE POLICY "Users can view their own policies" ON policies
    FOR SELECT USING (auth.uid()::text = user_wallet_address OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own policies" ON policies
    FOR INSERT WITH CHECK (auth.uid()::text = user_wallet_address OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own policies" ON policies
    FOR UPDATE USING (auth.uid()::text = user_wallet_address OR auth.role() = 'service_role');

-- Activities RLS: Users can view their own activities, global activities are viewable by all
CREATE POLICY "Users can view activities" ON activities
    FOR SELECT USING (true); -- Global activities are public for the activity feed

CREATE POLICY "Users can insert their own activities" ON activities
    FOR INSERT WITH CHECK (auth.uid()::text = user_wallet_address OR auth.role() = 'service_role');

-- Claim Records RLS: Users can only see their own claims
CREATE POLICY "Users can view their own claims" ON claim_records
    FOR SELECT USING (auth.uid()::text = user_wallet_address OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own claims" ON claim_records
    FOR INSERT WITH CHECK (auth.uid()::text = user_wallet_address OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own claims" ON claim_records
    FOR UPDATE USING (auth.uid()::text = user_wallet_address OR auth.role() = 'service_role');

-- ================== HELPFUL VIEWS ==================
-- View for user portfolio summary
CREATE OR REPLACE VIEW user_portfolio_summary AS
SELECT 
    user_wallet_address,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_policies,
    COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed_policies,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_policies,
    SUM(premium) as total_invested,
    SUM(CASE WHEN status = 'claimed' THEN claim_amount ELSE 0 END) as total_claimed,
    MIN(purchase_date) as first_policy_date,
    MAX(purchase_date) as latest_policy_date
FROM policies
GROUP BY user_wallet_address;

-- View for recent global activities (for public activity feed)
CREATE OR REPLACE VIEW recent_global_activities AS
SELECT 
    id,
    user_wallet_address,
    action,
    description,
    amount,
    policy_id,
    transaction_hash,
    timestamp,
    created_at,
    -- Anonymize wallet addresses for privacy (show first 6 + last 4 chars)
    CONCAT(
        SUBSTRING(user_wallet_address, 1, 6), 
        '...', 
        SUBSTRING(user_wallet_address, LENGTH(user_wallet_address) - 3)
    ) as anonymized_address
FROM activities
WHERE timestamp >= NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC;

-- ================== SAMPLE DATA (OPTIONAL) ==================
-- Uncomment to insert sample data for testing

/*
-- Sample policies
INSERT INTO policies (user_wallet_address, policy_type, premium, coverage, duration, metadata) VALUES
('0x742d35Cc6635C0532925a3b8D0A942C7ddAb62', 'Device Protection', 0.5, 500, 30, '{"features": ["theft", "damage"], "device": "iPhone 15"}'),
('0x8ba1f109551bD432803012645Hac136c1fdd58', 'Travel Insurance', 1.2, 1000, 14, '{"destination": "Europe", "coverage": "medical"}'),
('0x742d35Cc6635C0532925a3b8D0A942C7ddAb62', 'Health Insurance', 2.0, 2000, 365, '{"type": "comprehensive", "deductible": 100}');

-- Sample activities
INSERT INTO activities (user_wallet_address, action, description, amount, transaction_hash) VALUES
('0x742d35Cc6635C0532925a3b8D0A942C7ddAb62', 'policy_purchase', 'Purchased Device Protection policy for 0.5 SHM', 0.5, '0x1234567890abcdef'),
('0x8ba1f109551bD432803012645Hac136c1fdd58', 'policy_purchase', 'Purchased Travel Insurance policy for 1.2 SHM', 1.2, '0xabcdef1234567890'),
('0x742d35Cc6635C0532925a3b8D0A942C7ddAb62', 'policy_purchase', 'Purchased Health Insurance policy for 2.0 SHM', 2.0, '0x567890abcdef1234');
*/

-- ================== COMPLETION MESSAGE ==================
SELECT 'RiskZap database schema created successfully! 🎉' as message;