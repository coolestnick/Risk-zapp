import { supabase, Policy, Activity, ClaimRecord, PolicyType, UserProfile, PlatformStatistics, UserPortfolioSummary, RecentGlobalActivity } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

/**
 * Enhanced Database Service - Optimized for Frontend
 * 
 * This service is specifically designed to match the frontend requirements
 * and provides all the data operations needed by the RiskZap application.
 */
export class EnhancedDatabaseService {
  
  // ================== POLICY TYPE MANAGEMENT ==================
  
  /**
   * Get all available policy types
   */
  async getPolicyTypes(): Promise<PolicyType[]> {
    try {
      const { data, error } = await supabase
        .from('policy_types')
        .select('*')
        .eq('active', true)
        .order('popular', { ascending: false });

      if (error) {
        console.error('Error fetching policy types:', error);
        throw new Error(`Failed to fetch policy types: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Policy types service error:', error);
      throw error;
    }
  }

  /**
   * Get popular policy types for homepage
   */
  async getPopularPolicyTypes(): Promise<PolicyType[]> {
    try {
      const { data, error } = await supabase
        .from('policy_types')
        .select('*')
        .eq('active', true)
        .eq('popular', true)
        .order('base_premium', { ascending: true });

      if (error) {
        console.error('Error fetching popular policy types:', error);
        throw new Error(`Failed to fetch popular policy types: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Popular policy types service error:', error);
      throw error;
    }
  }

  // ================== USER PROFILE MANAGEMENT ==================

  /**
   * Get or create user profile
   */
  async getUserProfile(walletAddress: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        return await this.createUserProfile(walletAddress);
      }

      if (error) {
        console.error('Error fetching user profile:', error);
        throw new Error(`Failed to fetch user profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('User profile service error:', error);
      throw error;
    }
  }

  /**
   * Create new user profile
   */
  async createUserProfile(walletAddress: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            wallet_address: walletAddress.toLowerCase(),
            kyc_verified: false,
            kyc_status: 'pending',
            registration_date: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        throw new Error(`Failed to create user profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Create user profile service error:', error);
      throw error;
    }
  }

  /**
   * Update user KYC status
   */
  async updateUserKYC(
    walletAddress: string, 
    kycData: {
      kyc_verified: boolean;
      kyc_full_name?: string;
      kyc_id_number?: string;
      kyc_status: 'pending' | 'verified' | 'rejected';
    }
  ): Promise<boolean> {
    try {
      const updateData: any = {
        ...kycData,
        updated_at: new Date().toISOString(),
      };

      if (kycData.kyc_verified) {
        updateData.kyc_verification_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('wallet_address', walletAddress.toLowerCase());

      if (error) {
        console.error('Error updating user KYC:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Update KYC service error:', error);
      return false;
    }
  }

  // ================== ENHANCED POLICY MANAGEMENT ==================

  /**
   * Create a new policy with automatic calculations
   */
  async createPolicy(policyData: {
    userWalletAddress: string;
    policyType: string;
    premium: number;
    duration: number;
    metadata?: any;
    transactionHash?: string;
    blockNumber?: number;
    gasUsed?: number;
  }): Promise<Policy | null> {
    try {
      // Get policy type details for coverage calculation
      const policyType = await this.getPolicyTypeById(policyData.policyType);
      if (!policyType) {
        throw new Error(`Policy type ${policyData.policyType} not found`);
      }

      // Calculate platform fee and total paid (done automatically by trigger)
      const platformFee = policyData.premium * 0.05; // 5%
      const totalPaid = policyData.premium + platformFee;

      const { data, error } = await supabase
        .from('policies')
        .insert([
          {
            user_wallet_address: policyData.userWalletAddress.toLowerCase(),
            policy_type: policyData.policyType,
            premium: policyData.premium,
            duration: policyData.duration,
            metadata: policyData.metadata || {},
            transaction_hash: policyData.transactionHash,
            block_number: policyData.blockNumber,
            gas_used: policyData.gasUsed,
            network_id: 8080, // Shardeum network
          },
        ])
        .select(`
          *,
          policy_types!inner(name, features, coverage_description)
        `)
        .single();

      if (error) {
        console.error('Error creating policy:', error);
        throw new Error(`Failed to create policy: ${error.message}`);
      }

      // Log activity
      await this.logActivity({
        userWalletAddress: policyData.userWalletAddress,
        action: 'policy_purchase',
        description: `Purchased ${policyType.name} policy for ${policyData.premium} SHM`,
        amount: totalPaid,
        policyId: data.id,
        transactionHash: policyData.transactionHash,
      });

      return data;
    } catch (error) {
      console.error('Enhanced database service error:', error);
      throw error;
    }
  }

  /**
   * Get policy type by ID
   */
  async getPolicyTypeById(policyTypeId: string): Promise<PolicyType | null> {
    try {
      const { data, error } = await supabase
        .from('policy_types')
        .select('*')
        .eq('id', policyTypeId)
        .single();

      if (error) {
        console.error('Error fetching policy type:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Policy type by ID service error:', error);
      return null;
    }
  }

  /**
   * Get user policies with enhanced data
   */
  async getUserPolicies(walletAddress: string): Promise<Policy[]> {
    try {
      console.log('🔍 Fetching enhanced policies for wallet:', walletAddress);
      const { data, error } = await supabase
        .from('policies')
        .select(`
          *,
          policy_types!inner(name, features, coverage_description, icon)
        `)
        .eq('user_wallet_address', walletAddress.toLowerCase())
        .order('created_at', { ascending: false });

      console.log('📊 Enhanced database query result:', { data, error });

      if (error) {
        console.error('Error fetching user policies:', error);
        throw new Error(`Failed to fetch policies: ${error.message}`);
      }

      console.log('✅ Successfully fetched enhanced policies:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Enhanced database service error:', error);
      throw error;
    }
  }

  /**
   * Get active policies with current claim values
   */
  async getActivePoliciesWithClaimValues(walletAddress: string): Promise<Policy[]> {
    try {
      const { data, error } = await supabase
        .from('policies')
        .select(`
          *,
          policy_types!inner(name, features, coverage_description, icon)
        `)
        .eq('user_wallet_address', walletAddress.toLowerCase())
        .eq('status', 'active')
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Error fetching active policies:', error);
        throw new Error(`Failed to fetch active policies: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Active policies service error:', error);
      throw error;
    }
  }

  /**
   * Update policy status with automatic claim processing
   */
  async updatePolicyStatus(
    policyId: string,
    status: 'active' | 'expired' | 'claimed',
    claimAmount?: number
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (claimAmount && status === 'claimed') {
        updateData.claim_amount = claimAmount;
        updateData.claim_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('policies')
        .update(updateData)
        .eq('id', policyId);

      if (error) {
        console.error('Error updating policy status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Enhanced database service error:', error);
      return false;
    }
  }

  // ================== ENHANCED CLAIM MANAGEMENT ==================

  /**
   * Process a claim with detailed calculations
   */
  async processClaim(
    policyId: string,
    userWalletAddress: string,
    claimCalculation: {
      baseClaimAmount: number;
      claimPercentage: number;
      daysHeld: number;
      timeBonus: number;
      bonusAmount: number;
      withdrawalFee: number;
      totalClaimAmount: number;
      netPayout: number;
    }
  ): Promise<ClaimRecord | null> {
    try {
      // Create detailed claim record
      const { data: claimData, error: claimError } = await supabase
        .from('claim_records')
        .insert([
          {
            policy_id: policyId,
            user_wallet_address: userWalletAddress.toLowerCase(),
            base_claim_amount: claimCalculation.baseClaimAmount,
            claim_percentage: claimCalculation.claimPercentage,
            days_held: claimCalculation.daysHeld,
            time_bonus: claimCalculation.timeBonus,
            bonus_amount: claimCalculation.bonusAmount,
            withdrawal_fee: claimCalculation.withdrawalFee,
            total_claim_amount: claimCalculation.totalClaimAmount,
            net_payout: claimCalculation.netPayout,
            status: 'approved',
          },
        ])
        .select()
        .single();

      if (claimError) {
        console.error('Error creating claim record:', claimError);
        return null;
      }

      // Update policy status
      await this.updatePolicyStatus(policyId, 'claimed', claimCalculation.netPayout);

      // Log detailed claim activity
      await this.logActivity({
        userWalletAddress,
        action: 'policy_claim',
        description: `Claimed ${claimCalculation.netPayout} SHM (${claimCalculation.claimPercentage}% + ${claimCalculation.timeBonus}% time bonus)`,
        amount: claimCalculation.netPayout,
        policyId,
        metadata: {
          daysHeld: claimCalculation.daysHeld,
          timeBonus: claimCalculation.timeBonus,
          withdrawalFee: claimCalculation.withdrawalFee,
          grossClaim: claimCalculation.totalClaimAmount,
        },
      });

      return claimData;
    } catch (error) {
      console.error('Enhanced database service error:', error);
      return null;
    }
  }

  /**
   * Update claim payout status with transaction hash
   */
  async updateClaimPayout(
    claimId: string,
    payoutTransactionHash: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('claim_records')
        .update({
          status: 'paid',
          payout_transaction_hash: payoutTransactionHash,
          payout_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId);

      if (error) {
        console.error('Error updating claim payout:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Update claim payout service error:', error);
      return false;
    }
  }

  /**
   * Get user claims with detailed breakdown
   */
  async getUserClaims(walletAddress: string): Promise<ClaimRecord[]> {
    try {
      const { data, error } = await supabase
        .from('claim_records')
        .select(`
          *,
          policies!inner(policy_type, premium, purchase_date)
        `)
        .eq('user_wallet_address', walletAddress.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user claims:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Enhanced database service error:', error);
      return [];
    }
  }

  // ================== ENHANCED ACTIVITY LOGGING ==================

  /**
   * Log enhanced activity with metadata
   */
  async logActivity(activityData: {
    userWalletAddress: string;
    action: 'policy_purchase' | 'policy_claim' | 'payment' | 'kyc_verification' | 'underwriting_assessment' | 'risk_assessment' | 'policy_creation' | 'wallet_connection' | 'network_switch' | 'transaction_confirmation';
    description: string;
    amount?: number;
    policyId?: string;
    transactionHash?: string;
    status?: 'success' | 'pending' | 'failed';
    metadata?: any;
  }): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([
          {
            user_wallet_address: activityData.userWalletAddress.toLowerCase(),
            action: activityData.action,
            description: activityData.description,
            amount: activityData.amount,
            policy_id: activityData.policyId,
            transaction_hash: activityData.transactionHash,
            status: activityData.status || 'success',
            metadata: activityData.metadata || {},
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error logging activity:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Enhanced database service error:', error);
      return null;
    }
  }

  /**
   * Get global activity feed with anonymization
   */
  async getGlobalActivities(limit: number = 100): Promise<RecentGlobalActivity[]> {
    try {
      const { data, error } = await supabase
        .from('recent_global_activities')
        .select('*')
        .limit(limit);

      if (error) {
        console.error('Error fetching global activities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Enhanced database service error:', error);
      return [];
    }
  }

  /**
   * Get user activity history
   */
  async getUserActivities(walletAddress: string, limit: number = 50): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_wallet_address', walletAddress.toLowerCase())
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user activities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Enhanced database service error:', error);
      return [];
    }
  }

  // ================== ANALYTICS & DASHBOARD ==================

  /**
   * Get platform statistics
   */
  async getPlatformStatistics(): Promise<PlatformStatistics | null> {
    try {
      const { data, error } = await supabase
        .from('platform_statistics')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('Error fetching platform statistics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Platform statistics service error:', error);
      return null;
    }
  }

  /**
   * Get user portfolio summary
   */
  async getUserPortfolioSummary(walletAddress: string): Promise<UserPortfolioSummary | null> {
    try {
      const { data, error } = await supabase
        .from('user_portfolio_summary')
        .select('*')
        .eq('user_wallet_address', walletAddress.toLowerCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // No policies yet, return empty portfolio
        return {
          user_wallet_address: walletAddress.toLowerCase(),
          active_policies: 0,
          claimed_policies: 0,
          expired_policies: 0,
          total_policies: 0,
          total_invested: 0,
          total_claimed: 0,
          current_claim_value: 0,
          profit_loss: 0,
          first_policy_date: new Date().toISOString(),
          latest_policy_date: new Date().toISOString(),
        };
      }

      if (error) {
        console.error('Error fetching user portfolio:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('User portfolio service error:', error);
      return null;
    }
  }

  /**
   * Get all user addresses who have interacted with the platform
   */
  async getAllUserAddresses(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('policies')
        .select('user_wallet_address')
        .not('user_wallet_address', 'is', null);

      if (error) {
        console.error('Error fetching user addresses:', error);
        return [];
      }

      // Get unique addresses
      const uniqueAddresses = [...new Set(data.map(policy => policy.user_wallet_address))];
      return uniqueAddresses;
    } catch (error) {
      console.error('Get user addresses service error:', error);
      return [];
    }
  }

  /**
   * Get user interaction summary
   */
  async getUserInteractionSummary(): Promise<Array<{
    user_wallet_address: string;
    total_policies: number;
    total_invested: number;
    total_claims: number;
    last_activity: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('user_portfolio_summary')
        .select('*')
        .order('total_invested', { ascending: false });

      if (error) {
        console.error('Error fetching user interaction summary:', error);
        return [];
      }

      return data.map(user => ({
        user_wallet_address: user.user_wallet_address,
        total_policies: user.total_policies,
        total_invested: user.total_invested,
        total_claims: user.claimed_policies,
        last_activity: user.latest_policy_date,
      }));
    } catch (error) {
      console.error('User interaction summary service error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const enhancedDatabaseService = new EnhancedDatabaseService();
export default EnhancedDatabaseService;