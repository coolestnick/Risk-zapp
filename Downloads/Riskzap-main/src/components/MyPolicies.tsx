import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { localDatabaseService } from '@/services/localDatabase';
import { 
  Shield, 
  Clock, 
  DollarSign, 
  User, 
  FileText, 
  Download, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Calendar,
  Hash,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/components/WalletConnector';

interface PolicyRecord {
  policyId: string;
  premium: number;
  platformFee: number;
  totalPaid: number;
  purchaseDate: string;
  userAddress: string;
  txHash: string;
  status: 'active' | 'expired' | 'claimed';
  policyName?: string;
  policyType?: string;
  coverageAmount?: number;
  expiryDate?: string;
  claimDate?: string;
  claimAmount?: number;
  baseClaimAmount?: number;
  timeBonus?: number;
  claimPercentage?: number;
  daysSincePurchase?: number;
  withdrawalFee?: number;
  netPayout?: number;
}

const MyPolicies: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { account } = useWallet();

  const calculatePotentialClaim = (policy: PolicyRecord) => {
    const purchaseDate = new Date(policy.purchaseDate);
    const currentDate = new Date();
    const daysSincePurchase = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let claimPercentage = 0;
    let timeBonus = 0;
    
    if (daysSincePurchase <= 1) {
      claimPercentage = 0.5;
    } else if (daysSincePurchase <= 7) {
      claimPercentage = 5 + (daysSincePurchase * 0.5);
    } else if (daysSincePurchase <= 30) {
      const weeksHeld = Math.floor(daysSincePurchase / 7);
      claimPercentage = 10 + (weeksHeld * 1);
    } else if (daysSincePurchase <= 90) {
      const monthsHeld = Math.floor(daysSincePurchase / 30);
      claimPercentage = 25 + (monthsHeld * 2);
    } else if (daysSincePurchase <= 180) {
      const monthsHeld = Math.floor(daysSincePurchase / 30);
      claimPercentage = 50 + ((monthsHeld - 3) * 3);
    } else if (daysSincePurchase <= 365) {
      const monthsHeld = Math.floor(daysSincePurchase / 30);
      claimPercentage = 75 + ((monthsHeld - 6) * 2);
    } else {
      claimPercentage = 100;
      const yearsHeld = Math.floor(daysSincePurchase / 365);
      timeBonus = yearsHeld * 5;
    }
    
    claimPercentage = Math.min(claimPercentage, 100);
    const totalPercentage = claimPercentage + timeBonus;
    const potentialAmount = (policy.totalPaid * totalPercentage) / 100;
    
    return {
      claimPercentage: totalPercentage,
      potentialAmount,
      daysSincePurchase
    };
  };

  useEffect(() => {
    loadUserPolicies();
  }, [account]);

  // Add periodic refresh to catch new policies
  useEffect(() => {
    const interval = setInterval(() => {
      if (account) {
        loadUserPolicies();
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [account]);

  // Listen for localStorage changes (when policies are added from other components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ZENITH_POLICIES' && account) {
        console.log('🔄 Storage changed, refreshing policies...');
        loadUserPolicies();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [account]);

  const loadUserPolicies = async () => {
    setLoading(true);
    try {
      if (!account) {
        setPolicies([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Starting to load user policies...');
      console.log('👤 Account:', account);
      console.log('⏰ Timestamp:', new Date().toISOString());
      
      
      await localDatabaseService.inspectLocalStorage();

      const dbPolicies = await localDatabaseService.getUserPolicies(account);
      
      console.log('📊 Raw policies from localStorage:', dbPolicies);
      console.log('📈 Number of raw policies:', dbPolicies.length);

      if (dbPolicies.length === 0) {
        console.log('📭 No policies found for user');
        setPolicies([]);
        setLoading(false);
        return;
      }
      console.log('📊 Number of raw policies:', dbPolicies.length);
      
        const enhancedPolicies = dbPolicies.map((policy: any) => {
        const policyId = policy.metadata?.policyId || policy.policy_type || 'general';
        console.log('🔧 Converting policy:', { originalPolicy: policy, policyId });
        
        return {
          policyId: policyId,
          premium: policy.premium,
          platformFee: policy.metadata?.platformFee || (policy.premium * 0.02), // 2% platform fee
          userAddress: policy.user_wallet_address,
          txHash: policy.metadata?.txHash || '',
          status: policy.status,
          coverage: policy.coverage,
          duration: policy.duration,
          features: policy.metadata?.features || [],
          purchaseDate: policy.purchase_date,
          totalPaid: policy.metadata?.totalPaid || policy.premium,
          claimAmount: policy.claim_amount,
          claimDate: policy.claim_date,
          policyName: getPolicyName(policyId),
          policyType: getPolicyType(policyId),
          coverageAmount: getCoverageAmount(policyId, policy.premium),
          expiryDate: getExpiryDate(policy.purchase_date, policyId)
        };
      });

      console.log('✅ Enhanced policies for UI:', enhancedPolicies);
      console.log('📊 Number of enhanced policies:', enhancedPolicies.length);
      console.log('🔗 Setting policies in state...');

      setPolicies(enhancedPolicies);
      
      console.log('✅ Policies set in state successfully');
    } catch (error) {
      console.error('Error loading policies:', error);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const getPolicyName = (policyId: string) => {
    const policyNames: { [key: string]: string } = {
      'device-protection': 'Device Protection Insurance',
      'travel-insurance': 'Travel Insurance',
      'health-micro': 'Health Micro-Insurance',
      'event-coverage': 'Event Coverage Insurance',
      'freelancer-protection': 'Freelancer Protection'
    };
    return policyNames[policyId] || 'Insurance Policy';
  };

  const getPolicyType = (policyId: string) => {
    const policyTypes: { [key: string]: string } = {
      'device-protection': 'Electronics',
      'travel-insurance': 'Travel',
      'health-micro': 'Health',
      'event-coverage': 'Event',
      'freelancer-protection': 'Professional'
    };
    return policyTypes[policyId] || 'General';
  };

  const getCoverageAmount = (policyId: string, premium: number) => {
    // Coverage is typically 10-20x the premium for micro-insurance
    const multiplier = policyId === 'health-micro' ? 20 : 15;
    return premium * multiplier;
  };

  const getExpiryDate = (purchaseDate: string, policyId: string) => {
    const purchase = new Date(purchaseDate);
    const daysToAdd = policyId === 'travel-insurance' ? 30 : 365; // Travel: 30 days, others: 1 year
    const expiry = new Date(purchase.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    return expiry.toISOString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'expired': return 'text-red-500';
      case 'claimed': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      case 'claimed': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const downloadPolicyPDF = (policy: PolicyRecord) => {
    // Create a simple policy document text
    const policyDocument = `
RISKZAP INSURANCE POLICY CERTIFICATE
=====================================

Policy Details:
- Policy ID: ${policy.policyId}
- Policy Name: ${policy.policyName}
- Policy Type: ${policy.policyType}
- Status: ${policy.status.toUpperCase()}

Coverage Information:
- Coverage Amount: ${policy.coverageAmount} SHM 
- Premium Paid: ${policy.premium} SHM
- Platform Fee: ${policy.platformFee} SHM
--------------------------------------------
- Total Paid: ${policy.totalPaid} SHM

Policyholder:
- Wallet Address: ${policy.userAddress}

- Purchase Date: ${formatDate(policy.purchaseDate)}
- Expiry Date: ${formatDate(policy.expiryDate || '')}

Transaction:
- Transaction Hash: ${policy.txHash}
- Blockchain: Shardeum Liberty 1.X

Terms & Conditions:
This is a micro-insurance policy powered by blockchain technology.
Claims are subject to verification and approval.

Generated on: ${new Date().toLocaleString()}
Platform: RiskZap Insurance (Shardeum Liberty 1.X)
    `;

    // Create and download the file
    const blob = new Blob([policyDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RiskZap_Policy_${policy.policyId}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const viewOnExplorer = (txHash: string) => {
    window.open(`https://explorer-unstable.shardeum.org/transaction/${txHash}`, '_blank');
  };


  const fileClaim = async (policy: PolicyRecord) => {
    try {
      if (!account) {
        alert('Please connect your wallet to file a claim.');
        return;
      }

      const claimInfo = calculatePotentialClaim(policy);
      
      // Show confirmation dialog
      const confirmed = confirm(
        `File claim for Policy ${policy.policyId}?\n\n` +
        `Current claim value: ${claimInfo.potentialAmount.toFixed(4)} SHM\n` +
        `Claim percentage: ${claimInfo.claimPercentage.toFixed(1)}%\n` +
        `Days held: ${claimInfo.daysSincePurchase}\n\n` +
        `This action will mark your policy as claimed and cannot be undone.`
      );

      if (!confirmed) return;

      // Update policy status in local database
      const claimDate = new Date().toISOString();
      const updatedPolicy = {
        ...policy,
        status: 'claimed' as const,
        claimDate: claimDate,
        claimAmount: claimInfo.potentialAmount,
        claimPercentage: claimInfo.claimPercentage,
        daysSincePurchase: claimInfo.daysSincePurchase,
        baseClaimAmount: claimInfo.potentialAmount,
        timeBonus: 0,
        withdrawalFee: 0,
        netPayout: claimInfo.potentialAmount
      };

      // Update the policy in the database
      await localDatabaseService.updatePolicyStatus(policy.policyId, 'claimed', claimInfo.potentialAmount);

      // Log the claim activity
      await localDatabaseService.logActivity({
        userWalletAddress: account,
        action: 'claim_filed',
        description: `Filed claim for ${policy.policyName} - ${claimInfo.potentialAmount.toFixed(4)} SHM`,
        amount: claimInfo.potentialAmount,
        policyId: policy.policyId,
      });

      // Update local state
      setPolicies(prevPolicies => 
        prevPolicies.map(p => 
          p.policyId === policy.policyId ? updatedPolicy : p
        )
      );

      alert(`Claim filed successfully!\n\nClaim Amount: ${claimInfo.potentialAmount.toFixed(4)} SHM\nStatus: Processed`);
      
    } catch (error) {
      console.error('Error filing claim:', error);
      alert('Failed to file claim. Please try again.');
    }
  };

  if (!account) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-gray-900/90 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-white">My Policies</h2>
        </div>
        <div className="text-center py-8 text-gray-400">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Connect your wallet to view your insurance policies</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-gray-900/90 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-primary animate-pulse" />
          <h2 className="text-xl font-bold text-white">My Policies</h2>
        </div>
        <div className="space-y-4">   
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-600 rounded mb-2" />
              <div className="h-3 bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900 backdrop-blur-md shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">My Policies</h2>
          <span className="bg-gray-800 text-cyan-400 px-3 py-1 rounded-full text-xs font-semibold border border-gray-600">
            {policies.length} {policies.length === 1 ? 'Policy' : 'Policies'}
          </span>
        </div>
        <button
          onClick={loadUserPolicies}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800 text-cyan-400 hover:bg-gray-700 transition-colors duration-200 border border-gray-600"
          title="Refresh policies"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Policy Summary */}
      {policies.length > 0 && (
        <div className="mb-8 p-6 rounded-xl bg-gray-800 backdrop-blur-md border border-gray-700 shadow-lg">
          <h3 className="font-semibold mb-6 text-sm text-white">Portfolio Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-gray-900 border border-gray-600">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-gray-300">Active Policies</span>
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-400">
                {policies.filter(p => p.status === 'active').length}
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-900 border border-gray-600">
              <div className="flex items-center justify-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-300">Total Invested</span>
              </div>
              <div className="text-2xl font-bold font-mono text-green-400">
                {policies.reduce((sum, p) => sum + p.totalPaid, 0).toFixed(4)} SHM
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-900 border border-gray-600">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-gray-300">Claim Value</span>
              </div>
              <div className="text-2xl font-bold font-mono text-orange-400">
                {policies
                  .filter(p => p.status === 'active')
                  .reduce((sum, p) => sum + calculatePotentialClaim(p).potentialAmount, 0)
                  .toFixed(4)} SHM
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policies Grid - Premium Black & White Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {policies.map((policy, index) => (
            <motion.div
              key={policy.txHash}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01, y: -2 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              {/* Status Badge */}
              {policy.status === 'active' && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-white text-black px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </div>
                </div>
              )}

              <div className="relative p-6">
                {/* Policy Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{policy.policyName}</h3>
                  <p className="text-sm text-gray-400">{policy.policyType} Coverage</p>
                </div>

                {/* Premium Display */}
                <div className="text-center mb-8">
                  <div className="text-4xl font-bold font-mono text-white mb-2">
                    {policy.premium}
                    <span className="text-lg font-normal text-gray-400 ml-2">SHM</span>
                  </div>
                  <div className="text-sm text-gray-400">Premium Paid</div>
                </div>

                {/* Policy Features */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">Coverage: <span className="font-mono text-white">{policy.coverageAmount} SHM</span></span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                      <Hash className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">ID: <span className="font-mono text-white">{policy.policyId}</span></span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                      <Clock className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">Expires: <span className="text-white">{formatDate(policy.expiryDate || '')}</span></span>
                  </div>
                </div>

                {/* Claim Potential for Active Policies */}
                {policy.status === 'active' && (() => {
                  const claimInfo = calculatePotentialClaim(policy);
                  return (
                    <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold font-mono text-yellow-400 mb-1">
                          {claimInfo.potentialAmount.toFixed(4)} SHM
                        </div>
                        <div className="text-sm text-white font-medium">Current Claim Value</div>
                        <div className="text-xs text-gray-400 mt-2">
                          {claimInfo.claimPercentage.toFixed(1)}% rate • Held {claimInfo.daysSincePurchase} days
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Claim Results for Claimed Policies */}
                {policy.status === 'claimed' && policy.claimAmount && (
                  <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-center">
                      <div className="text-2xl font-bold font-mono text-white mb-1">
                        {policy.claimAmount.toFixed(4)} SHM
                      </div>
                      <div className="text-sm text-gray-300 font-medium">Claim Processed</div>
                      <div className="text-xs text-gray-400 mt-2">
                        {policy.claimPercentage?.toFixed(1)}% rate • Held {policy.daysSincePurchase} days
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {policy.status === 'active' && (
                    <button 
                      onClick={() => fileClaim(policy)}
                      className="w-full px-4 py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition-colors duration-200"
                    >
                      File Claim
                    </button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => downloadPolicyPDF(policy)}
                      className="px-4 py-2 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button 
                      onClick={() => viewOnExplorer(policy.txHash)}
                      className="px-4 py-2 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Explorer
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {policies.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-400">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No insurance policies found</p>
            <p className="text-xs">Purchase a policy to see it here!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPolicies;
