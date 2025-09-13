import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MyPolicies from '@/components/MyPolicies';
import { useWallet } from '@/components/WalletConnector';

interface MyPoliciesPageProps {
  onBack: () => void;
}

const MyPoliciesPage: React.FC<MyPoliciesPageProps> = ({ onBack }) => {
  const { account, isConnected } = useWallet();

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gradient-fire">My Insurance Policies</h1>
            <p className="text-muted-foreground">
              {isConnected 
                ? `Manage your insurance policies for ${account?.slice(0, 6)}...${account?.slice(-4)}`
                : 'Connect your wallet to view your policies'
              }
            </p>
          </div>
        </div>
      </motion.div>

      {/* Policy Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-8"
      >
        {/* Main Policies Component */}
        <div className="lg:col-span-1">
          <MyPolicies />
        </div>

        {/* Policy Statistics */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <PolicyStatistics />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Policy Statistics Component
const PolicyStatistics: React.FC = () => {
  const [stats, setStats] = React.useState({
    totalPolicies: 0,
    totalPremiumPaid: 0,
    totalCoverage: 0,
    activePolicies: 0
  });

  React.useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = () => {
    try {
      const policies = JSON.parse(localStorage.getItem('USER_POLICIES') || '[]');
      
      const totalPolicies = policies.length;
      const totalPremiumPaid = policies.reduce((sum: number, policy: any) => sum + policy.totalPaid, 0);
      const activePolicies = policies.filter((policy: any) => policy.status === 'active').length;
      
      // Calculate total coverage (simplified calculation)
      const totalCoverage = policies.reduce((sum: number, policy: any) => {
        const multiplier = policy.policyId === 'health-micro' ? 20 : 15;
        return sum + (policy.premium * multiplier);
      }, 0);

      setStats({
        totalPolicies,
        totalPremiumPaid,
        totalCoverage,
        activePolicies
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Policies',
      value: stats.totalPolicies.toString(),
      description: 'Policies purchased',
      color: 'text-blue-500'
    },
    {
      title: 'Active Policies',
      value: stats.activePolicies.toString(),
      description: 'Currently active',
      color: 'text-green-500'
    },
    {
      title: 'Total Premium Paid',
      value: `${stats.totalPremiumPaid.toFixed(4)} SHM`,
      description: 'Including platform fees',
      color: 'text-orange-500'
    },
    {
      title: 'Total Coverage',
      value: `${stats.totalCoverage.toFixed(2)} SHM`,
      description: 'Insurance coverage amount',
      color: 'text-purple-500'
    }
  ];

  if (stats.totalPolicies === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-sm p-6">
      <h3 className="text-xl font-bold mb-6">Policy Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="p-4 rounded-lg bg-background/50 border border-primary/10"
          >
            <div className={`text-2xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </div>
            <div className="text-sm font-medium mb-1">{stat.title}</div>
            <div className="text-xs text-muted-foreground">{stat.description}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MyPoliciesPage;
