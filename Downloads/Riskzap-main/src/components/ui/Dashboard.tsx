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
  AlertCircle
} from 'lucide-react';
import LiveActivityFeed from '@/components/LiveActivityFeed';
import { ActivityService } from '@/services/activityService';
import { useWallet } from '@/components/WalletConnector';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<any>;
  trend: 'up' | 'down' | 'stable';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: IconComponent, trend }) => {
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-warning';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl glass-card p-6 elevated-card"
    >
      <div className="absolute inset-0 geometric-bg opacity-20" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
          <div className="flex items-center gap-1 mt-3">
            <TrendingUp className={`h-4 w-4 ${trendColor}`} />
            <span className={`text-sm font-medium ${trendColor}`}>{change}</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 glow-primary">
          <IconComponent className="h-7 w-7 text-primary" />
        </div>
      </div>
    </motion.div>
  );
};

interface UserPoliciesDisplayProps {}

const UserPoliciesDisplay: React.FC<UserPoliciesDisplayProps> = () => {
  const { isConnected, account } = useWallet();
  const [userPolicies, setUserPolicies] = useState<any[]>([]);

  useEffect(() => {
    if (isConnected && account) {
      // Load user's policies from localStorage or generate sample data
      const policies = [
        {
          id: 'POL-001',
          type: 'Travel Insurance',
          premium: '0.25 SHM',
          coverage: '3.75 SHM',
          status: 'Active',
          expires: '2025-02-16'
        },
        {
          id: 'POL-002', 
          type: 'Device Protection',
          premium: '0.15 SHM',
          coverage: '2.25 SHM',
          status: 'Active',
          expires: '2025-03-01'
        }
      ];
      setUserPolicies(policies);
    }
  }, [isConnected, account]);

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Connect your wallet to view your policies</p>
      </div>
    );
  }

  if (userPolicies.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No policies found</p>
        <p className="text-sm text-muted-foreground mt-2">Create your first policy to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {userPolicies.map((policy, index) => (
        <motion.div
          key={policy.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-4 rounded-lg glass-card border-glow-soft"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{policy.type}</h4>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>ID: {policy.id}</span>
                <span>Premium: {policy.premium}</span>
                <span>Coverage: {policy.coverage}</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                policy.status === 'Active' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  policy.status === 'Active' ? 'bg-success' : 'bg-warning'
                }`} />
                {policy.status}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Expires: {policy.expires}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { isConnected, account } = useWallet();

  // Quick Action Handlers
  const handleCreatePolicy = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to create a policy');
      return;
    }
    
    // Simulate policy creation
    await ActivityService.logPolicyCreation(account!, 'Custom Micro-Policy');
    alert('🏗️ Policy Creation Process Started!\n\nPolicy Type: Custom Micro-Policy\nStatus: Initiated\nNext Step: Risk Assessment\n\nCheck the Live Activity Feed for updates!');
  };

  const handleProcessClaim = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to process claims');
      return;
    }

    // Simulate claim processing
    const claimAmount = (Math.random() * 3 + 1).toFixed(2); // Random amount 1-4 SHM
    await ActivityService.logPolicyClaim(account!, 'Travel Insurance', claimAmount);
    alert(`✅ Claim Process Initiated!\n\nClaim ID: CL-${Date.now()}\nPolicy Type: Travel Insurance\nClaim Amount: ${claimAmount} SHM\nStatus: Under Review\nExpected Processing: 24-48 hours\n\n📱 Watch the Live Activity Feed for real-time updates!`);
  };

  const handleKYCVerification = async () => {
    if (!isConnected) {
      alert('Please connect your wallet for KYC verification');
      return;
    }

    // Simulate KYC verification
    await ActivityService.logKYCVerification(account!);
    alert(`🔒 KYC Verification Completed!\n\nUser: ${account!.slice(0, 6)}...${account!.slice(-4)}\nStatus: Verified ✅\nLevel: Basic KYC\nValid Until: ${new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString()}\n\n🔴 Activity logged to Live Feed!`);
  };

  const handleUnderwriting = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to start underwriting');
      return;
    }

    // Simulate AI underwriting with random values
    const riskScore = (Math.random() * 3 + 1).toFixed(1); // 1.0-4.0
    const recommendedPremium = (Math.random() * 0.5 + 0.3).toFixed(2); // 0.3-0.8 SHM
    
    await ActivityService.logUnderwritingActivity(account!, riskScore, recommendedPremium);
    alert(`🤖 AI Underwriting Analysis Complete!\n\nRisk Score: ${riskScore}/10 (Low Risk)\nRecommended Premium: ${recommendedPremium} SHM\nMax Coverage: ${(parseFloat(recommendedPremium) * 15).toFixed(1)} SHM\nValidity: 365 days\nAI Confidence: 94.7%\n\n📊 Results added to Live Activity Feed!`);
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
      icon: Award,
      trend: 'up' as const
    },
    {
      title: 'Avg. Response Time',
      value: '2.3s',
      change: '-22.1%',
      icon: Zap,
      trend: 'down' as const
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto container-padding space-y-12">
      {/* Professional Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center section-padding bg-gradient-to-br from-background via-primary/5 to-background rounded-3xl relative overflow-hidden"
      >
        <div className="absolute inset-0 geometric-bg opacity-30" />
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full glass-card border-glow-soft"
          >
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-success">Live on Shardeum Unstablenet</span>
          </motion.div>
          
          <h1 className="text-hero text-gradient-primary mb-6 leading-tight">
            Built for those <br />
            <span className="text-primary">powered by you</span>
          </h1>
          
          <p className="text-subhero max-w-2xl mx-auto mb-8">
            Leverage any crypto tokens with a protocol trusted by billions 
            for its performance and reliability in decentralized insurance.
          </p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-8"
          >
            <Button
              className="webzi-button btn-primary px-8 py-3 text-base"
              onClick={() => {/* Handle early access */}}
            >
              GET EARLY ACCESS
            </Button>
            <Button
              variant="outline"
              className="webzi-button px-8 py-3 text-base border-primary/20 hover:border-primary/40"
              onClick={() => {/* Handle demo */}}
            >
              View Demo
            </Button>
          </motion.div>
        </div>
      </motion.div>

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
        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <LiveActivityFeed maxItems={8} />
        </motion.div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 glow-primary">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreatePolicy}
                className="p-6 rounded-xl glass-card border-glow-soft text-left group transition-all duration-300 hover:shadow-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 glow-primary group-hover:scale-110 transition-transform">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Create Policy</h3>
                    <p className="text-sm text-muted-foreground">Launch new insurance policy with AI risk assessment</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProcessClaim}
                className="p-6 rounded-xl glass-card border-glow-soft text-left group transition-all duration-300 hover:shadow-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-success/20 to-success/10 glow-primary group-hover:scale-110 transition-transform">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Process Claim</h3>
                    <p className="text-sm text-muted-foreground">Fast-track claim verification and payout</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleKYCVerification}
                className="p-6 rounded-xl glass-card border-glow-soft text-left group transition-all duration-300 hover:shadow-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-warning/20 to-warning/10 glow-primary group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">KYC Verification</h3>
                    <p className="text-sm text-muted-foreground">Complete identity verification for enhanced coverage</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUnderwriting}
                className="p-6 rounded-xl glass-card border-glow-soft text-left group transition-all duration-300 hover:shadow-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 glow-primary group-hover:scale-110 transition-transform">
                    <Activity className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">AI Underwriting</h3>
                    <p className="text-sm text-muted-foreground">Smart risk analysis with machine learning</p>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* User Policies Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold mb-4 text-gradient-primary">My Insurance Policies</h2>
          <UserPoliciesDisplay />
        </motion.div>
      </div>

      {/* Network Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-success floating" />
            <span className="font-semibold text-lg">Shardeum Unstablenet Status</span>
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
  );
};

export default Dashboard;
