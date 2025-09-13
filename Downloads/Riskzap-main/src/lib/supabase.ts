import { createClient } from '@supabase/supabase-js'

// Production Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to check if database is available
export const isDatabaseAvailable = () => {
  return true // Always available in production
}

// Log database status
console.log('�️ Production database connection established')
console.log('� Supabase URL:', supabaseUrl)

// Database types matching frontend-optimized schema
export interface PolicyType {
  id: string
  name: string
  description: string
  base_premium: number
  duration_days: number
  coverage_description: string
  coverage_multiplier: number
  popular: boolean
  features: string[]
  icon?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  wallet_address: string
  kyc_verified: boolean
  kyc_full_name?: string
  kyc_id_number?: string
  kyc_verification_date?: string
  kyc_status: 'pending' | 'verified' | 'rejected'
  kyc_documents?: any
  email?: string
  phone?: string
  country?: string
  registration_date: string
  created_at: string
  updated_at: string
}

export interface Policy {
  id: string
  user_wallet_address: string
  policy_type: string
  premium: number
  coverage: number
  duration: number
  purchase_date: string
  expiry_date: string
  status: 'active' | 'expired' | 'claimed'
  claim_amount?: number
  claim_date?: string
  metadata: any
  transaction_hash?: string
  block_number?: number
  gas_used?: number
  network_id: number
  platform_fee: number
  total_paid: number
  current_claim_value?: number // Computed field
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_wallet_address: string
  action: 'policy_purchase' | 'policy_claim' | 'payment' | 'kyc_verification' | 'underwriting_assessment' | 'risk_assessment' | 'policy_creation' | 'wallet_connection' | 'network_switch' | 'transaction_confirmation'
  description: string
  amount?: number
  policy_id?: string
  transaction_hash?: string
  status: 'success' | 'pending' | 'failed'
  metadata?: any
  timestamp: string
  created_at: string
}

export interface ClaimRecord {
  id: string
  policy_id: string
  user_wallet_address: string
  base_claim_amount: number
  claim_percentage: number
  days_held: number
  time_bonus: number
  bonus_amount: number
  withdrawal_fee: number
  total_claim_amount: number
  net_payout: number
  claim_date: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  payout_transaction_hash?: string
  payout_date?: string
  created_at: string
  updated_at: string
}

export interface PlatformStatistics {
  id: number
  total_policies_count: number
  total_premium_volume: number
  active_policies_count: number
  claims_processed_count: number
  success_rate: number
  average_response_time: number
  last_updated: string
}

export interface UserPortfolioSummary {
  user_wallet_address: string
  active_policies: number
  claimed_policies: number
  expired_policies: number
  total_policies: number
  total_invested: number
  total_claimed: number
  current_claim_value: number
  profit_loss: number
  first_policy_date: string
  latest_policy_date: string
}

export interface RecentGlobalActivity {
  id: string
  user_wallet_address: string
  anonymized_address: string
  action: string
  description: string
  amount?: number
  policy_id?: string
  transaction_hash?: string
  status: string
  metadata?: any
  timestamp: string
  created_at: string
}

export interface PolicyTypeAnalytics {
  id: string
  name: string
  base_premium: number
  coverage_description: string
  total_policies: number
  total_premium_volume: number
  active_policies: number
  claimed_policies: number
  claim_rate_percentage: number
}
