const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface UserInteraction {
  walletAddress: string;
  interactionType: 'connect_wallet' | 'view_policies' | 'purchase_policy' | 'claim_policy' | 'cancel_policy' | 'view_dashboard' | 'view_analytics' | 'deposit_funds' | 'withdraw_funds' | 'visit_page';
  policyId?: string;
  transactionHash?: string;
  amount?: number;
  tokenSymbol?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
}

export interface UserAnalytics {
  user: {
    walletAddress: string;
    firstInteraction: string;
    lastInteraction: string;
    totalInteractions: number;
    hasPurchased: boolean;
    totalPurchases: number;
    totalSpent: number;
    activePolicies: number;
  };
  interactionSummary: Array<{
    _id: string;
    count: number;
    lastInteraction: string;
  }>;
  recentInteractions: UserInteraction[];
}

class TrackingService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async trackInteraction(interaction: UserInteraction): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tracking/interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...interaction,
          sessionId: this.sessionId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to track interaction');
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error tracking interaction:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async batchTrackInteractions(interactions: UserInteraction[]): Promise<{ success: boolean; processed?: number; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tracking/interactions/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interactions: interactions.map(interaction => ({
            ...interaction,
            sessionId: this.sessionId,
          })),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to batch track interactions');
      }

      return { success: true, processed: data.processed, message: data.message };
    } catch (error) {
      console.error('Error batch tracking interactions:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getUserAnalytics(walletAddress: string): Promise<UserAnalytics | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/user/${walletAddress}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch user analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return null;
    }
  }

  async getPlatformAnalytics(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/platform`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch platform analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching platform analytics:', error);
      return null;
    }
  }

  async getUserHistory(
    walletAddress: string, 
    options: { limit?: number; offset?: number; type?: string } = {}
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.type) params.append('type', options.type);

      const response = await fetch(
        `${API_BASE_URL}/api/tracking/user/${walletAddress}/history?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch user history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user history:', error);
      return null;
    }
  }

  // Helper methods for common tracking scenarios
  async trackWalletConnection(walletAddress: string) {
    return this.trackInteraction({
      walletAddress,
      interactionType: 'connect_wallet'
    });
  }

  async trackPolicyPurchase(walletAddress: string, policyId: string, amount: number, transactionHash: string) {
    return this.trackInteraction({
      walletAddress,
      interactionType: 'purchase_policy',
      policyId,
      amount,
      transactionHash,
      tokenSymbol: 'SHM'
    });
  }

  // New method to create policy in backend
  async createPolicy(policyData: {
    walletAddress: string;
    policyName: string;
    policyType?: string;
    coverageAmount: number;
    premiumAmount: number;
    platformFee?: number;
    totalPaid: number;
    transactionHash: string;
    blockNumber?: number;
    expiryDate?: string;
    metadata?: Record<string, any>;
    contractAddress?: string;
    tokenSymbol?: string;
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/policies/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policyData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create policy');
      }

      return { success: true, policy: data.policy, message: data.message };
    } catch (error) {
      console.error('Error creating policy:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Check if user has purchased policies
  async checkUserHasPurchased(walletAddress: string): Promise<{ hasPurchased: boolean; policies: number } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/policies/user/${walletAddress}/has-purchased`);
      
      if (!response.ok) {
        throw new Error('Failed to check purchase status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking purchase status:', error);
      return null;
    }
  }

  // Get user policy status
  async getUserPolicyStatus(walletAddress: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/policies/user/${walletAddress}/status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch policy status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching policy status:', error);
      return null;
    }
  }

  // Get user policies
  async getUserPolicies(walletAddress: string, options: { status?: string; limit?: number; offset?: number } = {}) {
    try {
      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const response = await fetch(
        `${API_BASE_URL}/api/policies/user/${walletAddress}?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching policies:', error);
      return null;
    }
  }

  async trackPageVisit(walletAddress: string, page: string) {
    return this.trackInteraction({
      walletAddress,
      interactionType: 'visit_page',
      metadata: { page }
    });
  }

  async trackPolicyView(walletAddress: string, policyId?: string) {
    return this.trackInteraction({
      walletAddress,
      interactionType: 'view_policies',
      policyId
    });
  }

  async trackDashboardView(walletAddress: string) {
    return this.trackInteraction({
      walletAddress,
      interactionType: 'view_dashboard'
    });
  }

  // Check if backend is healthy
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

export const trackingService = new TrackingService();
export default trackingService;