import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Shield,
  Zap,
  Users,
  DollarSign,
  Clock,
  Activity,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingCart
} from 'lucide-react';
import LiveActivityFeed from '@/components/LiveActivityFeed';
          
          <h1 className="text-hero text-white mb-6 leading-tight">
            Simple<br />
            <span className="text-cyan-400">Protection</span>
          </h1>
          
import { ActivityService } from '@/services/activityService';
import { useWallet } from '@/components/WalletConnector';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<any>;
  trend: 'up' | 'down' | 'stable';
}

interface Policy {
  id: string;
  type: string;
  premium: string;
  coverage: string;
  status: 'Active' | 'Expired' | 'Pending';
  expires: string;
  created: string;
  duration: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: IconComponent, trend }) => {
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-warning';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl card-elevated p-6"
    >
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
          <div className="flex items-center gap-1 mt-3">
            <TrendingUp className={`h-4 w-4 ${trendColor}`} />
            <span className={`text-sm font-medium ${trendColor}`}>{change}</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
          <IconComponent className="h-6 w-6 text-primary" />
        </div>
      </div>
    </motion.div>
  );
};

const UserPoliciesDisplay: React.FC<{ policies: Policy[] }> = ({ policies }) => {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Connect your wallet to see your policies</p>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No policies yet</p>
        <p className="text-sm text-muted-foreground mt-2">Create your first policy to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-yellow-500">Your Policies</h2>
        <div className="text-gray-400 text-sm">
          {policies.length} policies
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((policy, index) => (
          <motion.div
            key={policy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-slate-800 rounded-2xl p-6 border border-slate-700"
          >
            {/* Popular Badge */}
            {index === 0 && (
              <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Popular
              </div>
            )}

            {/* Policy Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-orange-500 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-1">{policy.type}</h3>
                <p className="text-gray-400 text-sm">{policy.description}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-green-400 mb-2">
                  <DollarSign className="w-5 h-5 mx-auto" />
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {policy.premium.split(' ')[0]}
                  <span className="text-sm font-normal text-gray-400 ml-1">{policy.premium.split(' ')[1]}</span>
                </div>
                <div className="text-gray-400 text-sm mt-1">Premium</div>
              </div>

              <div className="text-center">
                <div className="text-yellow-400 mb-2">
                  <Clock className="w-5 h-5 mx-auto" />
                </div>
                <div className="text-lg font-semibold text-white">{policy.duration}</div>
                <div className="text-gray-400 text-sm mt-1">Duration</div>
              </div>

              <div className="text-center">
                <div className="text-yellow-400 mb-2">
                  <Shield className="w-5 h-5 mx-auto" />
                </div>
                <div className="text-lg font-semibold text-white">{policy.coverage}</div>
                <div className="text-gray-400 text-sm mt-1">Coverage</div>
              </div>
            </div>

            {/* Quick Buy Button */}
            <div className="mb-4">
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Quick Buy
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-teal-600 hover:bg-teal-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200">
                Claim
              </button>
              <button className="bg-slate-600 hover:bg-slate-500 text-gray-300 py-2.5 px-4 rounded-lg font-medium transition-colors duration-200">
                Details
              </button>
            </div>

            {/* Status Indicator */}
            <div className="absolute bottom-4 right-4">
              <div className={`w-2 h-2 rounded-full ${
                policy.status === 'Active' ? 'bg-green-400' : 'bg-gray-500'
              }`} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

interface DashboardProps {
  onSectionChange?: (section: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSectionChange }) => {
  const { isConnected, account } = useWallet();
  const [userPolicies, setUserPolicies] = useState<Policy[]>([]);

  // Initialize with existing policies when wallet connects
  useEffect(() => {
    if (isConnected && account) {
      const existingPolicies: Policy[] = [
        {
          id: 'POL-001',
          type: 'Device Protection',
          premium: '0.5 SHM',
          coverage: 'Up to $500',
          status: 'Active',
          expires: '2025-02-16',
          created: '2024-01-16',
          duration: '24 hours',
          description: 'Instant coverage for smartphones, tablets, and electronics'
        },
        {
          id: 'POL-002', 
          type: 'Event Coverage',
          premium: '1.2 SHM',
          coverage: 'Up to $1,000',
          status: 'Active',
          expires: '2025-03-01',
          created: '2024-01-01',
          duration: 'Single event',
          description: 'Quick insurance for concerts, sports events, and gatherings'
        }
      ];
      setUserPolicies(existingPolicies);
    } else {
      setUserPolicies([]);
    }
  }, [isConnected, account]);

  // Helper functions
  const generatePolicyId = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `POL-${timestamp}`;
  };

  const calculateCoverage = (premium: number) => {
    return `Up to $${Math.round(premium * 1000)}`;
  };

  const getExpiryDate = () => {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry.toISOString().split('T')[0];
  };

  // Create Policy Handler
  const handleCreatePolicy = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to create a policy');
      return;
    }
    
    const policyOptions = [
      { type: 'Device Protection', description: 'Instant coverage for smartphones, tablets, and electronics', duration: '24 hours' },
      { type: 'Micro Travel', description: 'Short-term travel insurance for day trips and weekends', duration: '1-7 days' },
      { type: 'Event Coverage', description: 'Quick insurance for concerts, sports events, and gatherings', duration: 'Single event' },
      { type: 'Equipment Rental', description: 'Coverage for rented cameras, tools, and equipment', duration: 'Rental period' }
    ];
    
    const randomPolicy = policyOptions[Math.floor(Math.random() * policyOptions.length)];
    const premiumAmount = (Math.random() * 2 + 0.5).toFixed(1);
    const coverageAmount = calculateCoverage(parseFloat(premiumAmount));
    
    const newPolicy: Policy = {
      id: generatePolicyId(),
      type: randomPolicy.type,
      premium: `${premiumAmount} SHM`,
      coverage: coverageAmount,
      status: 'Active',
      expires: getExpiryDate(),
      created: new Date().toISOString().split('T')[0],
      duration: randomPolicy.duration,
      description: randomPolicy.description
    };

    setUserPolicies(prevPolicies => [newPolicy, ...prevPolicies]);
    
    await ActivityService.logPolicyCreation(account!, randomPolicy.type);
    
    alert(`🎉 Policy created successfully!\n\nType: ${randomPolicy.type}\nID: ${newPolicy.id}\nPremium: ${premiumAmount} SHM\nCoverage: ${coverageAmount}\nStatus: Active\n\n✅ Check your policies section!`);
  };

  const handleProcessClaim = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to process claims');
      return;
    }

    const claimAmount = (Math.random() * 3 + 1).toFixed(2);
    await ActivityService.logPolicyClaim(account!, 'Travel Insurance', claimAmount);
    alert(`✅ Claim submitted!\n\nClaim ID: CL-${Date.now()}\nAmount: ${claimAmount} SHM\nStatus: Under review`);
  };

  const handleKYCVerification = async () => {
    if (!isConnected) {
      alert('Please connect your wallet for KYC verification');
      return;
    }

    await ActivityService.logKYCVerification(account!);
    alert(`🔒 ID verification complete!\n\nUser: ${account!.slice(0, 6)}...${account!.slice(-4)}\nStatus: Verified ✅\nLevel: Basic\nValid until: ${new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString()}\n\n🔴 Logged to activity feed!`);
  };

  const handleUnderwriting = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to start underwriting');
      return;
    }

    const riskScore = (Math.random() * 3 + 1).toFixed(1);
    const recommendedPremium = (Math.random() * 0.5 + 0.3).toFixed(2);
    
    await ActivityService.logUnderwritingActivity(account!, riskScore, recommendedPremium);
    alert(`🤖 Risk analysis complete!\n\nRisk score: ${riskScore}/10 (Low risk)\nSuggested premium: ${recommendedPremium} SHM\nMax coverage: ${(parseFloat(recommendedPremium) * 15).toFixed(1)} SHM\nValid for: 365 days\nAI confidence: 94.7%\n\n📊 Added to activity feed!`);
  };
  
  const stats = [
    {
      title: 'Active Policies',
      value: '1,247',
      change: '+12.5%',
      icon: Shield,
      trend: 'up' as const
    },
    {
      title: 'Total Premium (SHM)',
      value: '8,429.3',
      change: '+8.2%',
      icon: DollarSign,
      trend: 'up' as const
    },
    {
      title: 'Claims Processed',
      value: '342',
      change: '+15.7%',
      icon: CheckCircle,
      trend: 'up' as const
    },
    {
      title: 'Avg. Response Time',
      value: '2.3s',
      change: '-22.1%',
      icon: Clock,
      trend: 'down' as const
    }
  ];

  return (
    <div className="w-full">
      {/* Curved Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="smooth-curve-header text-center relative"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full card-elevated border-success"
          >
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-success">Live on Shardeum Unstablenet</span>
          </motion.div>
          
          <h1 className="text-hero text-gradient-primary mb-6 leading-tight">
            Protect Everything<br />
            <span className="text-primary">You Love, Instantly</span>
          </h1>
          
          <p className="text-subhero max-w-2xl mx-auto mb-6">
            From your phone to your next trip — Riskzap brings lightning-fast, AI-powered insurance on Shardeum.
          </p>

          {/* Platform Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-3xl mx-auto mb-8"
          >
            <div className="bg-background/30 backdrop-blur-sm border border-primary/20 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">2.0%</div>
                  <div className="text-sm text-muted-foreground">Platform Fee</div>
                  <div className="text-xs text-muted-foreground">On policy purchase</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-success">0.5%</div>
                  <div className="text-sm text-muted-foreground">Withdrawal Fee</div>
                  <div className="text-xs text-muted-foreground">On claim payouts</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-warning">15-20x</div>
                  <div className="text-sm text-muted-foreground">Coverage Ratio</div>
                  <div className="text-xs text-muted-foreground">Premium to coverage</div>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-8"
          >
            <Button
              className="btn-primary px-8 py-3 text-base"
              onClick={() => onSectionChange?.('policies')}
            >
              Join Beta
            </Button>
            <Button
              variant="outline"
              className="px-8 py-3 text-base border-subtle hover:border-primary/40 bg-background/50"
              onClick={() => onSectionChange?.('flow')}
            >
              Try Demo
            </Button>
          </motion.div>
          

        </div>
      </motion.div>

      {/* Main Content Container */}
      <div className="w-full max-w-7xl mx-auto container-padding space-y-12">

      {/* Professional Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <LiveActivityFeed maxItems={8} />
        </motion.div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 gap-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="card-elevated rounded-xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-warning/10">
                <Zap className="h-6 w-6 text-warning" />
              </div>
              <h2 className="text-2xl font-bold">Quick Actions</h2>
              {isConnected ? (
                <div className="ml-auto flex items-center gap-2 text-sm text-success font-medium">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Wallet Connected
                </div>
              ) : (
                <div className="ml-auto flex items-center gap-2 text-sm text-warning font-medium">
                  <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                  Connect Wallet
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreatePolicy}
                className="p-6 rounded-xl card-elevated border-highlight text-left group transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">New Policy</h3>
                    <p className="text-sm text-muted-foreground">Start a new insurance policy with AI risk assessment</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProcessClaim}
                className="p-6 rounded-xl card-elevated border-success text-left group transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-success/10 group-hover:bg-success/15 transition-colors">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">File Claim</h3>
                    <p className="text-sm text-muted-foreground">Quick claim verification and payout</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleKYCVerification}
                className="p-6 rounded-xl card-elevated border-subtle text-left group transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-verification/10 group-hover:bg-verification/15 transition-colors">
                    <Users className="h-6 w-6 text-verification" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Verify ID</h3>
                    <p className="text-sm text-muted-foreground">Complete identity verification for better coverage</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUnderwriting}
                className="p-6 rounded-xl card-elevated border-subtle text-left group transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/15 transition-colors">
                    <Activity className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Risk Check</h3>
                    <p className="text-sm text-muted-foreground">Smart risk analysis powered by AI</p>
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Platform Information */}
            <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-primary/5 to-success/5 border border-primary/20">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Platform Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="font-semibold text-primary">Fees Structure</div>
                  <div className="text-muted-foreground">Platform: 2.0%</div>
                  <div className="text-muted-foreground">Withdrawal: 0.5%</div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-success">Coverage Ratios</div>
                  <div className="text-muted-foreground">Standard: 15x premium</div>
                  <div className="text-muted-foreground">Health: 20x premium</div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-warning">Network Info</div>
                  <div className="text-muted-foreground">Chain ID: 8080</div>
                  <div className="text-muted-foreground">Currency: SHM</div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-accent">Contract Status</div>
                  <div className="text-muted-foreground">Live & Verified</div>
                  <div className="text-muted-foreground">Gas: ~0.001 SHM</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Network Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card-elevated rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="font-semibold text-lg">Network Status</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Block Height:</span>
              <span className="font-mono font-medium">2,847,392</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Gas Price:</span>
              <span className="font-mono font-medium">1.2 gwei</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Network Load:</span>
              <span className="text-success font-semibold">Low</span>
            </div>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
