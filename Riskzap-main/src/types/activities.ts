export interface ActivityFeedItem {
  id: string;
  type: 'policy_purchase' | 'policy_claim' | 'payment' | 'kyc' | 'underwriting' | 'risk_assessment' | 'policy_creation';
  message: string;
  user_address: string;
  amount?: string; // SHM amount if applicable
  transaction_hash?: string;
  policy_type?: string;
  metadata?: Record<string, any>;
  created_at: string;
  status: 'success' | 'pending' | 'failed';
}

export interface ActivityStats {
  total_policies: number;
  total_premium: string;
  active_claims: number;
  success_rate: number;
}
