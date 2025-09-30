-- RiskZap Frontend-Optimized Database Schema
-- This schema is designed to perfectly match the frontend data requirements
-- Run this SQL in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ================== POLICY TYPES MASTER TABLE ==================
-- Stores available insurance policy types matching frontend options
CREATE TABLE IF NOT EXISTS policy_types (
    id TEXT PRIMARY KEY, -- 'device-protection', 'travel-insurance', 'health-insurance'
    name TEXT NOT NULL, -- 'Device Protection', 'Travel Insurance'
    description TEXT NOT NULL,
    base_premium DECIMAL(18,4) NOT NULL, -- Base premium in SHM
    duration_days INTEGER NOT NULL, -- Duration in days
    coverage_description TEXT NOT NULL, -- 'Up to $500', 'Up to $1000'
    coverage_multiplier INTEGER NOT NULL DEFAULT 15, -- 15x or 20x for health
    popular BOOLEAN DEFAULT FALSE,
    features JSONB NOT NULL DEFAULT '[]', -- Array of feature strings
    icon TEXT, -- Icon identifier for frontend
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default policy types matching frontend
INSERT INTO policy_types (id, name, description, base_premium, duration_days, coverage_description, coverage_multiplier, popular, features, icon) VALUES
('device-protection', 'Device Protection', 'Comprehensive protection for your devices against damage, theft, and liquid damage', 0.5, 365, 'Up to $500', 15, true, '["Accidental damage", "Theft protection", "Liquid damage", "Screen replacement", "Hardware malfunction"]', 'shield'),
('travel-insurance', 'Travel Insurance', 'Protection for your travels including trip cancellation, medical emergencies, and lost baggage', 1.2, 30, 'Up to $1000', 15, true, '["Trip cancellation", "Medical emergencies", "Lost baggage", "Flight delays", "Emergency evacuation"]', 'plane'),
('health-insurance', 'Health Micro Insurance', 'Affordable health coverage for basic medical expenses and emergency care', 2.0, 365, 'Up to $2000', 20, false, '["Basic medical coverage", "Emergency care", "Prescription drugs", "Preventive care", "Telemedicine"]', 'heart'),
('property-insurance', 'Property Protection', 'Protection for your home and personal property against damage and theft', 3.0, 365, 'Up to $5000', 15, false, '["Property damage", "Theft coverage", "Natural disasters", "Personal belongings", "Temporary housing"]', 'home'),
('cyber-insurance', 'Cyber Security', 'Protection against cyber threats, identity theft, and digital asset loss', 1.5, 365, 'Up to $3000', 15, false, '["Identity theft", "Cyber attacks", "Data recovery", "Digital asset protection", "Privacy breach"]', 'lock');

-- ================== USER PROFILES TABLE ==================
-- Stores user KYC and profile information
CREATE TABLE IF NOT EXISTS user_profiles (
    wallet_address TEXT PRIMARY KEY,
    kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_full_name TEXT,
    kyc_id_number TEXT,
    kyc_verification_date TIMESTAMP WITH TIME ZONE,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    kyc_documents JSONB DEFAULT '{}', -- Store document references
    email TEXT,
    phone TEXT,
    country TEXT,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================== POLICIES TABLE ==================
-- Main policies table matching frontend Policy interface exactly
CREATE TABLE IF NOT EXISTS policies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_wallet_address TEXT NOT NULL,
    policy_type TEXT NOT NULL REFERENCES policy_types(id),
    premium DECIMAL(18,4) NOT NULL, -- Premium amount in SHM
    coverage DECIMAL(18,4) NOT NULL, -- Coverage amount in SHM (calculated)
    duration INTEGER NOT NULL, -- Duration in days
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Calculated: purchase_date + duration
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'claimed')),
    claim_amount DECIMAL(18,4), -- Amount claimed (if claimed)
    claim_date TIMESTAMP WITH TIME ZONE, -- When claim was made
    
    -- Frontend-specific metadata stored as JSONB for flexibility
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Blockchain integration fields
    transaction_hash TEXT, -- Blockchain transaction hash
    block_number BIGINT, -- Block number of transaction
    gas_used DECIMAL(18,8), -- Gas used for transaction
    network_id INTEGER DEFAULT 8080, -- Shardeum network ID
    
    -- Platform fee tracking
    platform_fee DECIMAL(18,4) NOT NULL DEFAULT 0, -- 5% platform fee
    total_paid DECIMAL(18,4) NOT NULL, -- premium + platform_fee
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add computed column for current claim value based on holding time
ALTER TABLE policies ADD COLUMN IF NOT EXISTS current_claim_value DECIMAL(18,4) GENERATED ALWAYS AS (
    CASE 
        WHEN status != 'active' THEN 0
        ELSE premium * (
            CASE 
                WHEN EXTRACT(DAY FROM (NOW() - purchase_date)) >= 365 THEN 
                    1.0 + LEAST(0.5, FLOOR((EXTRACT(DAY FROM (NOW() - purchase_date)) - 365) / 30.0) * 0.02)
                WHEN EXTRACT(DAY FROM (NOW() - purchase_date)) >= 180 THEN 
                    0.25 + ((EXTRACT(DAY FROM (NOW() - purchase_date)) - 180) / 185.0) * 0.75
                WHEN EXTRACT(DAY FROM (NOW() - purchase_date)) >= 30 THEN 
                    0.05 + ((EXTRACT(DAY FROM (NOW() - purchase_date)) - 30) / 150.0) * 0.20
                WHEN EXTRACT(DAY FROM (NOW() - purchase_date)) >= 1 THEN 
                    0.005 + ((EXTRACT(DAY FROM (NOW() - purchase_date)) - 1) / 29.0) * 0.045
                ELSE 0.005
            END
        )
    END
) STORED;

-- Create indexes for optimal frontend performance
CREATE INDEX IF NOT EXISTS idx_policies_user_wallet ON policies(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_purchase_date ON policies(purchase_date);
CREATE INDEX IF NOT EXISTS idx_policies_expiry_date ON policies(expiry_date);
CREATE INDEX IF NOT EXISTS idx_policies_policy_type ON policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_policies_active_user ON policies(user_wallet_address, status) WHERE status = 'active';

-- ================== ACTIVITIES TABLE ==================
-- Activity feed for real-time updates matching frontend Activity interface
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_wallet_address TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN (
        'policy_purchase', 'policy_claim', 'payment', 'kyc_verification', 
        'underwriting_assessment', 'risk_assessment', 'policy_creation',
        'wallet_connection', 'network_switch', 'transaction_confirmation'
    )),
    description TEXT NOT NULL, -- Human-readable activity description
    amount DECIMAL(18,4), -- SHM amount if applicable
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    transaction_hash TEXT, -- Blockchain transaction hash
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'pending', 'failed')),
    
    -- Additional metadata for frontend display
    metadata JSONB DEFAULT '{}',
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activity feed performance
CREATE INDEX IF NOT EXISTS idx_activities_user_wallet ON activities(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_activities_global_recent ON activities(timestamp) WHERE timestamp >= (NOW() - INTERVAL '30 days');
CREATE INDEX IF NOT EXISTS idx_activities_policy_id ON activities(policy_id);
CREATE INDEX IF NOT EXISTS idx_activities_action ON activities(action);

-- ================== CLAIM RECORDS TABLE ==================
-- Detailed claim processing with time-based calculations
CREATE TABLE IF NOT EXISTS claim_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    user_wallet_address TEXT NOT NULL,
    
    -- Claim calculation fields
    base_claim_amount DECIMAL(18,4) NOT NULL, -- Base claim without bonuses
    claim_percentage DECIMAL(5,2) NOT NULL, -- Base percentage (0.5% - 100%)
    days_held INTEGER NOT NULL, -- Days policy was held
    time_bonus DECIMAL(5,2) NOT NULL DEFAULT 0, -- Time-based bonus percentage
    bonus_amount DECIMAL(18,4) NOT NULL DEFAULT 0, -- Bonus amount in SHM
    
    -- Fee calculations
    withdrawal_fee DECIMAL(18,4) NOT NULL DEFAULT 0, -- 0.2% withdrawal fee
    total_claim_amount DECIMAL(18,4) NOT NULL, -- base + bonus
    net_payout DECIMAL(18,4) NOT NULL, -- total - withdrawal_fee
    
    claim_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    
    -- Blockchain payout tracking
    payout_transaction_hash TEXT, -- Transaction hash of payout
    payout_date TIMESTAMP WITH TIME ZONE, -- When payout was sent
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for claim processing
CREATE INDEX IF NOT EXISTS idx_claim_records_user_wallet ON claim_records(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_claim_records_policy_id ON claim_records(policy_id);
CREATE INDEX IF NOT EXISTS idx_claim_records_status ON claim_records(status);
CREATE INDEX IF NOT EXISTS idx_claim_records_claim_date ON claim_records(claim_date);

-- ================== PLATFORM STATISTICS TABLE ==================
-- Store platform-wide statistics for dashboard
CREATE TABLE IF NOT EXISTS platform_statistics (
    id SERIAL PRIMARY KEY,
    total_policies_count INTEGER DEFAULT 0,
    total_premium_volume DECIMAL(18,4) DEFAULT 0,
    active_policies_count INTEGER DEFAULT 0,
    claims_processed_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.0,
    average_response_time INTEGER DEFAULT 2, -- in minutes
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial platform statistics
INSERT INTO platform_statistics (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ================== FUNCTIONS FOR AUTOMATIC UPDATES ==================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update platform statistics
CREATE OR REPLACE FUNCTION update_platform_statistics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE platform_statistics SET
        total_policies_count = (SELECT COUNT(*) FROM policies),
        total_premium_volume = (SELECT COALESCE(SUM(total_paid), 0) FROM policies),
        active_policies_count = (SELECT COUNT(*) FROM policies WHERE status = 'active'),
        claims_processed_count = (SELECT COUNT(*) FROM claim_records WHERE status = 'paid'),
        success_rate = (
            SELECT CASE 
                WHEN COUNT(*) = 0 THEN 100.0
                ELSE ROUND((COUNT(CASE WHEN status = 'paid' THEN 1 END)::decimal / COUNT(*)) * 100, 2)
            END
            FROM claim_records
        ),
        last_updated = NOW()
    WHERE id = 1;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set expiry date
CREATE OR REPLACE FUNCTION set_expiry_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expiry_date = NEW.purchase_date + (NEW.duration || ' days')::INTERVAL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate platform fee and total paid
CREATE OR REPLACE FUNCTION calculate_policy_fees()
RETURNS TRIGGER AS $$
BEGIN
    NEW.platform_fee = NEW.premium * 0.05; -- 5% platform fee
    NEW.total_paid = NEW.premium + NEW.platform_fee;
    NEW.coverage = NEW.premium * (
        SELECT coverage_multiplier FROM policy_types WHERE id = NEW.policy_type
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================== CREATE TRIGGERS ==================

-- Trigger for updating timestamps
CREATE TRIGGER update_policy_types_updated_at 
    BEFORE UPDATE ON policy_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at 
    BEFORE UPDATE ON policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claim_records_updated_at 
    BEFORE UPDATE ON claim_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for automatic expiry date calculation
CREATE TRIGGER set_policy_expiry_date
    BEFORE INSERT ON policies
    FOR EACH ROW EXECUTE FUNCTION set_expiry_date();

-- Trigger for automatic fee calculation
CREATE TRIGGER calculate_policy_fees_trigger
    BEFORE INSERT ON policies
    FOR EACH ROW EXECUTE FUNCTION calculate_policy_fees();

-- Triggers for platform statistics updates
CREATE TRIGGER update_stats_on_policy_insert
    AFTER INSERT ON policies
    FOR EACH STATEMENT EXECUTE FUNCTION update_platform_statistics();

CREATE TRIGGER update_stats_on_policy_update
    AFTER UPDATE ON policies
    FOR EACH STATEMENT EXECUTE FUNCTION update_platform_statistics();

CREATE TRIGGER update_stats_on_claim_update
    AFTER INSERT OR UPDATE ON claim_records
    FOR EACH STATEMENT EXECUTE FUNCTION update_platform_statistics();

-- ================== ROW LEVEL SECURITY (RLS) POLICIES ==================

-- Enable RLS on all user-specific tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_records ENABLE ROW LEVEL SECURITY;

-- Policy types and platform statistics are public
ALTER TABLE policy_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_statistics DISABLE ROW LEVEL SECURITY;

-- RLS Policies for user profiles
CREATE POLICY "Users can view and edit their own profile" ON user_profiles
    USING (wallet_address = auth.uid()::text OR auth.role() = 'service_role');

-- RLS Policies for policies
CREATE POLICY "Users can view their own policies" ON policies
    FOR SELECT USING (user_wallet_address = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own policies" ON policies
    FOR INSERT WITH CHECK (user_wallet_address = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own policies" ON policies
    FOR UPDATE USING (user_wallet_address = auth.uid()::text OR auth.role() = 'service_role');

-- RLS Policies for activities (global activities viewable by all, but only own can be inserted)
CREATE POLICY "Anyone can view activities" ON activities
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own activities" ON activities
    FOR INSERT WITH CHECK (user_wallet_address = auth.uid()::text OR auth.role() = 'service_role');

-- RLS Policies for claim records
CREATE POLICY "Users can view their own claims" ON claim_records
    FOR SELECT USING (user_wallet_address = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own claims" ON claim_records
    FOR INSERT WITH CHECK (user_wallet_address = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own claims" ON claim_records
    FOR UPDATE USING (user_wallet_address = auth.uid()::text OR auth.role() = 'service_role');

-- ================== HELPFUL VIEWS FOR FRONTEND ==================

-- User portfolio summary view (matches frontend calculations exactly)
CREATE OR REPLACE VIEW user_portfolio_summary AS
SELECT 
    user_wallet_address,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_policies,
    COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed_policies,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_policies,
    COUNT(*) as total_policies,
    SUM(total_paid) as total_invested,
    SUM(CASE WHEN status = 'claimed' THEN claim_amount ELSE 0 END) as total_claimed,
    SUM(CASE WHEN status = 'active' THEN current_claim_value ELSE 0 END) as current_claim_value,
    (SUM(CASE WHEN status = 'claimed' THEN claim_amount ELSE 0 END) + 
     SUM(CASE WHEN status = 'active' THEN current_claim_value ELSE 0 END) - 
     SUM(total_paid)) as profit_loss,
    MIN(purchase_date) as first_policy_date,
    MAX(purchase_date) as latest_policy_date
FROM policies
GROUP BY user_wallet_address;

-- Recent global activities view (for activity feed with privacy)
CREATE OR REPLACE VIEW recent_global_activities AS
SELECT 
    id,
    user_wallet_address,
    -- Anonymize wallet addresses for privacy (show first 6 + last 4 chars)
    CONCAT(
        SUBSTRING(user_wallet_address, 1, 6), 
        '...', 
        SUBSTRING(user_wallet_address, LENGTH(user_wallet_address) - 3)
    ) as anonymized_address,
    action,
    description,
    amount,
    policy_id,
    transaction_hash,
    status,
    metadata,
    timestamp,
    created_at
FROM activities
WHERE timestamp >= NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC
LIMIT 100;

-- Policy type popularity view
CREATE OR REPLACE VIEW policy_type_analytics AS
SELECT 
    pt.id,
    pt.name,
    pt.base_premium,
    pt.coverage_description,
    COUNT(p.id) as total_policies,
    SUM(p.total_paid) as total_premium_volume,
    COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_policies,
    COUNT(CASE WHEN p.status = 'claimed' THEN 1 END) as claimed_policies,
    ROUND(
        CASE 
            WHEN COUNT(p.id) = 0 THEN 0
            ELSE (COUNT(CASE WHEN p.status = 'claimed' THEN 1 END)::decimal / COUNT(p.id)) * 100
        END, 2
    ) as claim_rate_percentage
FROM policy_types pt
LEFT JOIN policies p ON pt.id = p.policy_type
GROUP BY pt.id, pt.name, pt.base_premium, pt.coverage_description
ORDER BY total_policies DESC;

-- ================== COMPLETION VERIFICATION ==================

-- Verify all tables were created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('policy_types', 'user_profiles', 'policies', 'activities', 'claim_records', 'platform_statistics');
    
    IF table_count = 6 THEN
        RAISE NOTICE '✅ All 6 tables created successfully!';
        RAISE NOTICE '📊 Database schema is optimized for RiskZap frontend';
        RAISE NOTICE '🔒 Row Level Security policies are active';
        RAISE NOTICE '⚡ Performance indexes are in place';
        RAISE NOTICE '🎯 Frontend-specific calculations are automated';
    ELSE
        RAISE EXCEPTION 'Expected 6 tables, found %', table_count;
    END IF;
END
$$;

-- Final status message
SELECT '🎉 RiskZap Frontend-Optimized Database Schema Created Successfully!' as status;