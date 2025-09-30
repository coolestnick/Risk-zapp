import { toast } from '@/hooks/use-toast';

export interface LocalPolicy {
  id: string;
  user_wallet_address: string;
  policy_type: string;
  premium: number;
  coverage: number;
  duration: number;
  purchase_date: string;
  status: 'active' | 'expired' | 'claimed';
  claim_amount?: number;
  claim_date?: string;
  metadata: {
    policyId: string;
    txHash: string;
    platformFee: number;
    totalPaid: number;
    features: string[];
    walletAddress: string;
  };
  created_at: string;
  updated_at: string;
}

export interface LocalActivity {
  id: string;
  user_wallet_address: string;
  action: string;
  description: string;
  amount?: number;
  policy_id?: string;
  transaction_hash?: string;
  timestamp: string;
}

export interface LocalClaimRecord {
  id: string;
  policy_id: string;
  user_wallet_address: string;
  claim_amount: number;
  claim_percentage: number;
  days_held: number;
  time_bonus: number;
  claim_date: string;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
}

export class LocalDatabaseService {
  private POLICIES_KEY = 'ZENITH_POLICIES';
  private ACTIVITIES_KEY = 'ZENITH_ACTIVITIES';
  private CLAIMS_KEY = 'ZENITH_CLAIMS';

  // ================== POLICY MANAGEMENT ==================

  /**
   * Create a new policy in local storage
   */
  async createPolicy(policyData: {
    userWalletAddress: string;
    policyType: string;
    premium: number;
    coverage: string | number;
    duration: string | number;
    metadata?: any;
  }): Promise<LocalPolicy | null> {
    try {
      const policyId = `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Convert coverage and duration to numbers if they're strings
      const coverageAmount = typeof policyData.coverage === 'string' 
        ? this.extractCoverageAmount(policyData.coverage)
        : policyData.coverage;
      
      const durationDays = typeof policyData.duration === 'string'
        ? this.extractDurationDays(policyData.duration)
        : policyData.duration;

      const policy: LocalPolicy = {
        id: policyId,
        user_wallet_address: policyData.userWalletAddress.toLowerCase(),
        policy_type: policyData.policyType,
        premium: policyData.premium,
        coverage: coverageAmount,
        duration: durationDays,
        purchase_date: new Date().toISOString(),
        status: 'active',
        metadata: policyData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Get existing policies
      const existingPolicies = this.getPoliciesFromStorage();
      existingPolicies.push(policy);
      
      // Save to localStorage
      localStorage.setItem(this.POLICIES_KEY, JSON.stringify(existingPolicies));
      
      console.log('💾 Saved to localStorage with key:', this.POLICIES_KEY);
      console.log('📦 Total policies in storage:', existingPolicies.length);
      console.log('🆔 New policy ID:', policy.id);
      console.log('👤 Wallet address saved as:', policy.user_wallet_address);

      // Log activity
      await this.logActivity({
        userWalletAddress: policyData.userWalletAddress,
        action: 'policy_purchase',
        description: `Purchased ${policyData.policyType} policy for ${policyData.premium} SHM`,
        amount: policyData.premium,
        policyId: policy.id,
      });

      console.log('✅ Policy saved to local storage:', policy);
      return policy;
    } catch (error) {
      console.error('Error creating policy in local storage:', error);
      throw error;
    }
  }

  /**
   * Get all policies for a user from local storage
   */
  async getUserPolicies(walletAddress: string): Promise<LocalPolicy[]> {
    try {
      console.log('🔍 Fetching policies from local storage for wallet:', walletAddress);
      console.log('🗂️ Using storage key:', this.POLICIES_KEY);
      
      const allPolicies = this.getPoliciesFromStorage();
      console.log('📂 Total policies in storage:', allPolicies.length);
      console.log('📋 All policies:', allPolicies);
      
      const userPolicies = allPolicies.filter(policy => {
        const matches = policy.user_wallet_address.toLowerCase() === walletAddress.toLowerCase();
        console.log(`🔸 Policy ${policy.id}: ${policy.user_wallet_address} === ${walletAddress} ? ${matches}`);
        return matches;
      });
      
      console.log('📊 Found policies in local storage:', userPolicies.length);
      console.log('📋 User policies:', userPolicies);
      
      return userPolicies;
    } catch (error) {
      console.error('Error fetching user policies from local storage:', error);
      return [];
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
      const allPolicies = this.getPoliciesFromStorage();
      const policyIndex = allPolicies.findIndex(p => p.id === policyId);
      
      if (policyIndex === -1) {
        return false;
      }

      allPolicies[policyIndex].status = status;
      allPolicies[policyIndex].updated_at = new Date().toISOString();

      if (claimAmount && status === 'claimed') {
        allPolicies[policyIndex].claim_amount = claimAmount;
        allPolicies[policyIndex].claim_date = new Date().toISOString();
      }

      localStorage.setItem(this.POLICIES_KEY, JSON.stringify(allPolicies));
      return true;
    } catch (error) {
      console.error('Error updating policy status:', error);
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
  ): Promise<LocalClaimRecord | null> {
    try {
      const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const claimRecord: LocalClaimRecord = {
        id: claimId,
        policy_id: policyId,
        user_wallet_address: userWalletAddress.toLowerCase(),
        claim_amount: claimAmount,
        claim_percentage: claimPercentage,
        days_held: daysHeld,
        time_bonus: timeBonus,
        claim_date: new Date().toISOString(),
        status: 'approved',
        created_at: new Date().toISOString()
      };

      // Save claim record
      const existingClaims = this.getClaimsFromStorage();
      existingClaims.push(claimRecord);
      localStorage.setItem(this.CLAIMS_KEY, JSON.stringify(existingClaims));

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

      return claimRecord;
    } catch (error) {
      console.error('Error processing claim:', error);
      return null;
    }
  }

  /**
   * Get claim history for a user
   */
  async getUserClaims(walletAddress: string): Promise<LocalClaimRecord[]> {
    try {
      const allClaims = this.getClaimsFromStorage();
      return allClaims.filter(claim => 
        claim.user_wallet_address.toLowerCase() === walletAddress.toLowerCase()
      );
    } catch (error) {
      console.error('Error fetching user claims:', error);
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
  }): Promise<LocalActivity | null> {
    try {
      const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const activity: LocalActivity = {
        id: activityId,
        user_wallet_address: activityData.userWalletAddress.toLowerCase(),
        action: activityData.action,
        description: activityData.description,
        amount: activityData.amount,
        policy_id: activityData.policyId,
        transaction_hash: activityData.transactionHash,
        timestamp: new Date().toISOString()
      };

      const existingActivities = this.getActivitiesFromStorage();
      existingActivities.push(activity);
      localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(existingActivities));

      return activity;
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  }

  /**
   * Get activity feed for a user
   */
  async getUserActivities(walletAddress: string, limit: number = 50): Promise<LocalActivity[]> {
    try {
      const allActivities = this.getActivitiesFromStorage();
      const userActivities = allActivities
        .filter(activity => activity.user_wallet_address.toLowerCase() === walletAddress.toLowerCase())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
      
      return userActivities;
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  }

  /**
   * Get global activity feed (all users)
   */
  async getGlobalActivities(limit: number = 100): Promise<LocalActivity[]> {
    try {
      const allActivities = this.getActivitiesFromStorage();
      return allActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching global activities:', error);
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
      console.error('Error calculating portfolio summary:', error);
      return {
        totalInvested: 0,
        currentClaimValue: 0,
        activePolicies: 0,
        totalClaimed: 0,
        profitLoss: 0,
      };
    }
  }

  // ================== HELPER METHODS ==================

  private getPoliciesFromStorage(): LocalPolicy[] {
    try {
      console.log('📖 Reading from localStorage key:', this.POLICIES_KEY);
      const stored = localStorage.getItem(this.POLICIES_KEY);
      console.log('🔍 Raw stored data:', stored);
      
      if (!stored) {
        console.log('📭 No data found in localStorage');
        return [];
      }
      
      const parsed = JSON.parse(stored);
      console.log('📦 Parsed data:', parsed);
      console.log('📊 Number of policies:', parsed.length);
      
      return parsed;
    } catch (error) {
      console.error('❌ Error reading policies from storage:', error);
      return [];
    }
  }

  private getActivitiesFromStorage(): LocalActivity[] {
    try {
      const stored = localStorage.getItem(this.ACTIVITIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading activities from storage:', error);
      return [];
    }
  }

  private getClaimsFromStorage(): LocalClaimRecord[] {
    try {
      const stored = localStorage.getItem(this.CLAIMS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading claims from storage:', error);
      return [];
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

  // ================== DATA MANAGEMENT ==================

  /**
   * Debug method to inspect localStorage
   */
  async inspectLocalStorage(): Promise<void> {
    console.log('🔍 LOCALSTORAGE INSPECTION:');
    console.log('📋 Policies Key:', this.POLICIES_KEY);
    console.log('🏃 Activities Key:', this.ACTIVITIES_KEY);
    console.log('💰 Claims Key:', this.CLAIMS_KEY);
    
    const policies = localStorage.getItem(this.POLICIES_KEY);
    const activities = localStorage.getItem(this.ACTIVITIES_KEY);
    const claims = localStorage.getItem(this.CLAIMS_KEY);
    
    console.log('📊 Policies data:', policies);
    console.log('🏃 Activities data:', activities);
    console.log('💰 Claims data:', claims);
    
    if (policies) {
      try {
        const parsedPolicies = JSON.parse(policies);
        console.log('📦 Parsed policies:', parsedPolicies);
        console.log('📊 Policy count:', parsedPolicies.length);
      } catch (e) {
        console.error('❌ Error parsing policies:', e);
      }
    }
  }

  /**
   * Clear all local data (for testing/reset)
   */
  async clearAllData(): Promise<void> {
    localStorage.removeItem(this.POLICIES_KEY);
    localStorage.removeItem(this.ACTIVITIES_KEY);
    localStorage.removeItem(this.CLAIMS_KEY);
    console.log('🗑️ All local data cleared');
  }

  /**
   * Export all data as JSON (for backup)
   */
  async exportData(): Promise<string> {
    const data = {
      policies: this.getPoliciesFromStorage(),
      activities: this.getActivitiesFromStorage(),
      claims: this.getClaimsFromStorage(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }
}

// Export singleton instance
export const localDatabaseService = new LocalDatabaseService();
export default LocalDatabaseService;
