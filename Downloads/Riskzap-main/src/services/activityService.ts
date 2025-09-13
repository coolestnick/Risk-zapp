import { localDatabaseService } from './localDatabase';
import type { ActivityFeedItem } from '@/types/activities';

export class ActivityService {
  /**
   * Add a new activity to the feed (database version)
   */
  static async addActivity(activity: Omit<ActivityFeedItem, 'id' | 'created_at'>) {
    try {
      // Convert to database format
      const dbActivity = await localDatabaseService.logActivity({
        userWalletAddress: activity.user_address,
        action: activity.type,
        description: activity.message,
        amount: activity.amount ? parseFloat(activity.amount) : undefined,
        transactionHash: activity.transaction_hash,
      });

      if (dbActivity) {
        // Trigger custom event for real-time updates
        window.dispatchEvent(new CustomEvent('activity_feed_update', { detail: [dbActivity] }));
        return dbActivity;
      }

      return null;
    } catch (error) {
      console.error('Activity service error:', error);
      // Fallback to localStorage if database fails
      return this.addActivityFallback(activity);
    }
  }

  /**
   * Fallback method using localStorage
   */
  private static async addActivityFallback(activity: Omit<ActivityFeedItem, 'id' | 'created_at'>) {
    try {
      const activityWithId = {
        ...activity,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };

      const existing = JSON.parse(localStorage.getItem('activity_feed') || '[]');
      const updated = [activityWithId, ...existing].slice(0, 50);
      localStorage.setItem('activity_feed', JSON.stringify(updated));
      
      window.dispatchEvent(new CustomEvent('activity_feed_update', { detail: updated }));
      return activityWithId;
    } catch (error) {
      console.error('Activity fallback error:', error);
      return null;
    }
  }

  /**
   * Get recent activities for the feed
   */
  static async getRecentActivities(limit = 10, userAddress?: string) {
    try {
      if (userAddress) {
        // Get user-specific activities from database
        const dbActivities = await localDatabaseService.getUserActivities(userAddress, limit);
        if (dbActivities.length > 0) {
          return dbActivities.map(this.convertDbToActivityFormat);
        }
      } else {
        // Get global activities from database
        const dbActivities = await localDatabaseService.getGlobalActivities(limit);
        if (dbActivities.length > 0) {
          return dbActivities.map(this.convertDbToActivityFormat);
        }
      }

      // Fallback to localStorage
      const activities = JSON.parse(localStorage.getItem('activity_feed') || '[]');
      const filtered = userAddress 
        ? activities.filter((activity: any) => activity.user_address === userAddress)
        : activities;
      
      return filtered.slice(0, limit);
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  /**
   * Convert database activity to ActivityFeedItem format
   */
  private static convertDbToActivityFormat(dbActivity: any): ActivityFeedItem {
    return {
      id: dbActivity.id,
      type: dbActivity.action,
      message: dbActivity.description,
      user_address: dbActivity.user_wallet_address,
      amount: dbActivity.amount?.toString(),
      transaction_hash: dbActivity.transaction_hash,
      policy_type: dbActivity.policy_id ? 'insurance' : undefined,
      status: 'success',
      created_at: dbActivity.timestamp || dbActivity.created_at
    };
  }

  /**
   * Subscribe to real-time activity updates
   */
  static subscribeToActivities(callback: (activities: ActivityFeedItem[]) => void) {
    const handleUpdate = (event: CustomEvent) => {
      callback(event.detail);
    };

    window.addEventListener('activity_feed_update', handleUpdate as EventListener);

    // Return unsubscribe function
    return () => {
      window.removeEventListener('activity_feed_update', handleUpdate as EventListener);
    };
  }

  /**
   * Log policy purchase activity
   */
  static async logPolicyPurchase(
    userAddress: string,
    policyType: string,
    amount: string,
    transactionHash?: string
  ) {
    return this.addActivity({
      type: 'policy_purchase',
      message: `${policyType} policy purchased for ${amount} SHM`,
      user_address: userAddress,
      amount,
      transaction_hash: transactionHash,
      policy_type: policyType,
      status: 'success'
    });
  }

  /**
   * Log policy claim activity
   */
  static async logPolicyClaim(
    userAddress: string,
    policyType: string,
    amount: string,
    transactionHash?: string
  ) {
    return this.addActivity({
      type: 'policy_claim',
      message: `${policyType} insurance claim approved for ${amount} SHM`,
      user_address: userAddress,
      amount,
      transaction_hash: transactionHash,
      policy_type: policyType,
      status: 'success'
    });
  }

  /**
   * Log payment activity
   */
  static async logPayment(
    userAddress: string,
    amount: string,
    transactionHash?: string
  ) {
    return this.addActivity({
      type: 'payment',
      message: `Premium payment of ${amount} SHM received`,
      user_address: userAddress,
      amount,
      transaction_hash: transactionHash,
      status: 'success'
    });
  }

  /**
   * Log KYC verification
   */
  static async logKYCVerification(userAddress: string) {
    return this.addActivity({
      type: 'kyc',
      message: `KYC verification completed for user ${userAddress.slice(0, 6)}...`,
      user_address: userAddress,
      status: 'success'
    });
  }

  /**
   * Log risk assessment with more details
   */
  static async logRiskAssessment(userAddress: string, policyType: string, details?: string) {
    const message = details 
      ? `${details} completed for ${policyType}`
      : `Risk assessment completed for ${policyType} coverage`;
      
    return this.addActivity({
      type: 'risk_assessment',
      message,
      user_address: userAddress,
      policy_type: policyType,
      status: 'success'
    });
  }

  /**
   * Log underwriting activity
   */
  static async logUnderwritingActivity(userAddress: string, riskScore: string, recommendedPremium: string) {
    return this.addActivity({
      type: 'underwriting',
      message: `AI underwriting completed - Risk Score: ${riskScore}, Premium: ${recommendedPremium} SHM`,
      user_address: userAddress,
      amount: recommendedPremium,
      metadata: { riskScore, type: 'ai_assessment' },
      status: 'success'
    });
  }

  /**
   * Log policy creation initiation
   */
  static async logPolicyCreation(userAddress: string, policyType: string) {
    return this.addActivity({
      type: 'policy_purchase',
      message: `${policyType} policy creation initiated`,
      user_address: userAddress,
      policy_type: policyType,
      status: 'pending'
    });
  }
}
