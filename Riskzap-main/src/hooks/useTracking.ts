import { useCallback, useEffect } from 'react';
import trackingService, { UserInteraction } from '../services/trackingService';

export interface UseTrackingOptions {
  walletAddress?: string;
  autoTrackPageViews?: boolean;
}

export const useTracking = (options: UseTrackingOptions = {}) => {
  const { walletAddress, autoTrackPageViews = true } = options;

  // Track page views automatically
  useEffect(() => {
    if (walletAddress && autoTrackPageViews) {
      const currentPage = window.location.pathname;
      trackingService.trackPageVisit(walletAddress, currentPage);
    }
  }, [walletAddress, autoTrackPageViews]);

  const trackInteraction = useCallback(async (interaction: Omit<UserInteraction, 'walletAddress'>) => {
    if (!walletAddress) {
      console.warn('Cannot track interaction: walletAddress not provided');
      return { success: false, message: 'Wallet address required' };
    }

    return trackingService.trackInteraction({
      ...interaction,
      walletAddress,
    });
  }, [walletAddress]);

  const trackWalletConnection = useCallback(async () => {
    if (!walletAddress) return { success: false, message: 'Wallet address required' };
    return trackingService.trackWalletConnection(walletAddress);
  }, [walletAddress]);

  const trackPolicyPurchase = useCallback(async (
    policyId: string, 
    amount: number, 
    transactionHash: string
  ) => {
    if (!walletAddress) return { success: false, message: 'Wallet address required' };
    return trackingService.trackPolicyPurchase(walletAddress, policyId, amount, transactionHash);
  }, [walletAddress]);

  const trackPolicyView = useCallback(async (policyId?: string) => {
    if (!walletAddress) return { success: false, message: 'Wallet address required' };
    return trackingService.trackPolicyView(walletAddress, policyId);
  }, [walletAddress]);

  const trackDashboardView = useCallback(async () => {
    if (!walletAddress) return { success: false, message: 'Wallet address required' };
    return trackingService.trackDashboardView(walletAddress);
  }, [walletAddress]);

  const getUserAnalytics = useCallback(async () => {
    if (!walletAddress) return null;
    return trackingService.getUserAnalytics(walletAddress);
  }, [walletAddress]);

  const getUserHistory = useCallback(async (options?: { limit?: number; offset?: number; type?: string }) => {
    if (!walletAddress) return null;
    return trackingService.getUserHistory(walletAddress, options);
  }, [walletAddress]);

  const createPolicy = useCallback(async (policyData: any) => {
    if (!walletAddress) return { success: false, message: 'Wallet address required' };
    return trackingService.createPolicy({ ...policyData, walletAddress });
  }, [walletAddress]);

  const checkUserHasPurchased = useCallback(async () => {
    if (!walletAddress) return null;
    return trackingService.checkUserHasPurchased(walletAddress);
  }, [walletAddress]);

  const getUserPolicyStatus = useCallback(async () => {
    if (!walletAddress) return null;
    return trackingService.getUserPolicyStatus(walletAddress);
  }, [walletAddress]);

  const getUserPolicies = useCallback(async (options?: { status?: string; limit?: number; offset?: number }) => {
    if (!walletAddress) return null;
    return trackingService.getUserPolicies(walletAddress, options);
  }, [walletAddress]);

  return {
    trackInteraction,
    trackWalletConnection,
    trackPolicyPurchase,
    trackPolicyView,
    trackDashboardView,
    getUserAnalytics,
    getUserHistory,
    createPolicy,
    checkUserHasPurchased,
    getUserPolicyStatus,
    getUserPolicies,
    isTrackingEnabled: !!walletAddress,
  };
};

export default useTracking;