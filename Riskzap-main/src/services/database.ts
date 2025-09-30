import { supabase, Policy, Activity, ClaimRecord } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { enhancedDatabaseService } from './enhancedDatabase';

export class DatabaseService {
  // ================== POLICY MANAGEMENT ==================

  /**
   * Create a new policy in the database
   */
  async createPolicy(policyData: {
    userWalletAddress: string;
    policyType: string;
    premium: number;
    coverage: string | number;
    duration: string | number;
    metadata?: any;
  }): Promise<Policy | null> {
    try {
      // Convert coverage and duration to numbers if they're strings
      const coverageAmount = typeof policyData.coverage === 'string' 
        ? this.extractCoverageAmount(policyData.coverage)
        : policyData.coverage;
      
      const durationDays = typeof policyData.duration === 'string'
        ? this.extractDurationDays(policyData.duration)
        : policyData.duration;

      const { data, error } = await supabase
        .from('policies')
        .insert([
          {
            user_wallet_address: policyData.userWalletAddress,
            policy_type: policyData.policyType,
            premium: policyData.premium,
            coverage: coverageAmount,
            duration: durationDays,
            purchase_date: new Date().toISOString(),
            status: 'active',
            metadata: policyData.metadata || {},
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating policy:', error);
        throw new Error(`Failed to create policy: ${error.message}`);
      }

      // Log activity
      await this.logActivity({
        userWalletAddress: policyData.userWalletAddress,
        action: 'policy_purchase',
        description: `Purchased ${policyData.policyType} policy for ${policyData.premium} SHM`,
        amount: policyData.premium,
        policyId: data.id,
      });

      return data;
    } catch (error) {
      console.error('Database service error:', error);
      throw error;
    }
  }

  /**
   * Get all policies for a user
   */
  async getUserPolicies(walletAddress: string): Promise<Policy[]> {
    try {
      console.log('🔍 Fetching policies for wallet:', walletAddress);
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('user_wallet_address', walletAddress.toLowerCase())
        .order('created_at', { ascending: false });

      console.log('📊 Database query result:', { data, error });

      if (error) {
        console.error('Error fetching user policies:', error);
        throw new Error(`Failed to fetch policies: ${error.message}`);
      }

      console.log('✅ Successfully fetched policies:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Database service error:', error);
      throw error;
    }
  }

  /**
   * Update policy status
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
      console.error('Database service error:', error);
      return false;
    }
  }

  // ================== CLAIM MANAGEMENT ==================

  /**
   * Process a claim with time-based calculation
   */
  async processClaim(
    policyId: string,
    userWalletAddress: string,
    claimAmount: number,
    claimPercentage: number,
    daysHeld: number,
    timeBonus: number
  ): Promise<ClaimRecord | null> {
    try {
      // Create claim record
      const { data: claimData, error: claimError } = await supabase
        .from('claim_records')
        .insert([
          {
            policy_id: policyId,
            user_wallet_address: userWalletAddress,
            claim_amount: claimAmount,
            claim_percentage: claimPercentage,
            days_held: daysHeld,
            time_bonus: timeBonus,
            claim_date: new Date().toISOString(),
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
      await this.updatePolicyStatus(policyId, 'claimed', claimAmount);

      // Log activity
      await this.logActivity({
        userWalletAddress,
        action: 'claim_processed',
        description: `Claimed ${claimAmount} SHM (${claimPercentage}% + ${timeBonus}% time bonus)`,
        amount: claimAmount,
        policyId,
      });

      return claimData;
    } catch (error) {
      console.error('Database service error:', error);
      return null;
    }
  }

  /**
   * Get claim history for a user
   */
  async getUserClaims(walletAddress: string): Promise<ClaimRecord[]> {
    try {
      const { data, error } = await supabase
        .from('claim_records')
        .select('*')
        .eq('user_wallet_address', walletAddress)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user claims:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database service error:', error);
      return [];
    }
  }

  // ================== ACTIVITY LOGGING ==================

  /**
   * Log user activity
   */
  async logActivity(activityData: {
    userWalletAddress: string;
    action: string;
    description: string;
    amount?: number;
    policyId?: string;
    transactionHash?: string;
  }): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([
          {
            user_wallet_address: activityData.userWalletAddress,
            action: activityData.action,
            description: activityData.description,
            amount: activityData.amount,
            policy_id: activityData.policyId,
            transaction_hash: activityData.transactionHash,
            timestamp: new Date().toISOString(),
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
      console.error('Database service error:', error);
      return null;
    }
  }

  /**
   * Get activity feed for a user
   */
  async getUserActivities(walletAddress: string, limit: number = 50): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_wallet_address', walletAddress)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user activities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database service error:', error);
      return [];
    }
  }

  /**
   * Get global activity feed (all users)
   */
  async getGlobalActivities(limit: number = 100): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching global activities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database service error:', error);
      return [];
    }
  }

  // ================== ANALYTICS ==================

  /**
   * Get user portfolio summary
   */
  async getUserPortfolioSummary(walletAddress: string): Promise<{
    totalInvested: number;
    currentClaimValue: number;
    activePolicies: number;
    totalClaimed: number;
    profitLoss: number;
  }> {
    try {
      // Get all user policies
      const policies = await this.getUserPolicies(walletAddress);
      const claims = await this.getUserClaims(walletAddress);

      const totalInvested = policies.reduce((sum, policy) => sum + policy.premium, 0);
      const totalClaimed = claims.reduce((sum, claim) => sum + claim.claim_amount, 0);
      const activePolicies = policies.filter(p => p.status === 'active').length;

      // Calculate current claim value for active policies
      const currentClaimValue = policies
        .filter(p => p.status === 'active')
        .reduce((sum, policy) => {
          const daysSince = Math.floor(
            (new Date().getTime() - new Date(policy.purchase_date).getTime()) / (1000 * 60 * 60 * 24)
          );
          const claimAmount = this.calculateTimeBasedClaim(policy.premium, daysSince);
          return sum + claimAmount;
        }, 0);

      const profitLoss = totalClaimed + currentClaimValue - totalInvested;

      return {
        totalInvested,
        currentClaimValue,
        activePolicies,
        totalClaimed,
        profitLoss,
      };
    } catch (error) {
      console.error('Database service error:', error);
      return {
        totalInvested: 0,
        currentClaimValue: 0,
        activePolicies: 0,
        totalClaimed: 0,
        profitLoss: 0,
      };
    }
  }

  /**
   * Calculate time-based claim amount (same logic as frontend)
   */
  private calculateTimeBasedClaim(premium: number, daysSince: number): number {
    let claimPercentage = 0;
    let timeBonus = 0;

    if (daysSince >= 365) {
      claimPercentage = 100;
      timeBonus = Math.min(50, Math.floor((daysSince - 365) / 30) * 2);
    } else if (daysSince >= 180) {
      claimPercentage = 25 + ((daysSince - 180) / 185) * 75;
    } else if (daysSince >= 30) {
      claimPercentage = 5 + ((daysSince - 30) / 150) * 20;
    } else if (daysSince >= 1) {
      claimPercentage = 0.5 + ((daysSince - 1) / 29) * 4.5;
    } else {
      claimPercentage = 0.5;
    }

    const baseClaimAmount = premium * (claimPercentage / 100);
    const bonusAmount = premium * (timeBonus / 100);
    return baseClaimAmount + bonusAmount;
  }

  /**
   * Extract coverage amount from string like "Up to $500"
   */
  private extractCoverageAmount(coverageStr: string): number {
    const matches = coverageStr.match(/\$?([\d,]+)/);
    if (matches) {
      return parseFloat(matches[1].replace(',', ''));
    }
    return 1000; // Default coverage amount
  }

  /**
   * Extract duration in days from string like "30 days" or "1 year"
   */
  private extractDurationDays(durationStr: string): number {
    const lowerStr = durationStr.toLowerCase();
    
    if (lowerStr.includes('year')) {
      const matches = lowerStr.match(/(\d+)\s*year/);
      return matches ? parseInt(matches[1]) * 365 : 365;
    }
    
    if (lowerStr.includes('month')) {
      const matches = lowerStr.match(/(\d+)\s*month/);
      return matches ? parseInt(matches[1]) * 30 : 30;
    }
    
    if (lowerStr.includes('day')) {
      const matches = lowerStr.match(/(\d+)\s*day/);
      return matches ? parseInt(matches[1]) : 30;
    }
    
    return 365; // Default to 1 year
  }
}

// Export enhanced database service as the default
export const databaseService = enhancedDatabaseService;
export default enhancedDatabaseService;
