import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ExternalLink, Clock, User, DollarSign } from 'lucide-react';
import { ActivityService } from '@/services/activityService';
import type { ActivityFeedItem } from '@/types/activities';

interface LiveActivityFeedProps {
  maxItems?: number;
}

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ maxItems = 10 }) => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newActivityCount, setNewActivityCount] = useState(0);

  useEffect(() => {
    // Load initial activities
    loadActivities();

    // Subscribe to real-time updates
    const unsubscribe = ActivityService.subscribeToActivities((newActivities) => {
      setActivities(prev => {
        const prevIds = new Set(prev.map(a => a.id));
        const trulyNew = newActivities.filter(a => !prevIds.has(a.id));
        if (trulyNew.length > 0) {
          setNewActivityCount(prev => prev + trulyNew.length);
        }
        return newActivities.slice(0, maxItems);
      });
    });

    return unsubscribe;
  }, [maxItems]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await ActivityService.getRecentActivities(maxItems);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'policy_purchase':
        return '🛡️';
      case 'policy_creation':
        return '🏗️';
      case 'policy_claim':
        return '💰';
      case 'payment':
        return '💳';
      case 'kyc':
        return '🔒';
      case 'risk_assessment':
        return '📊';
      case 'underwriting':
        return '🤖';
      default:
        return '📝';
    }
  };

  const getStatusColor = (status: ActivityFeedItem['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (created_at: string) => {
    const now = new Date();
    const activityTime = new Date(created_at);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleViewOnExplorer = (hash?: string) => {
    if (hash) {
      window.open(`https://explorer-unstable.shardeum.org/transaction/${hash}`, '_blank');
    }
  };

  const clearNewActivityBadge = () => {
    setNewActivityCount(0);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-6 w-6 text-primary animate-pulse" />
          <h2 className="text-xl font-bold">Live Activity Feed</h2>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border-subtle">
              <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted/50 rounded w-1/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated rounded-xl border-subtle p-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Live Activity Feed</h2>
        {newActivityCount > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={clearNewActivityBadge}
            className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-semibold"
          >
            {newActivityCount} new
          </motion.button>
        )}
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Live
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl border-subtle hover:border-primary/20 transition-all group"
            >
              <div className={`w-2 h-2 rounded-full ${getStatusColor(activity.status)}`} />
              
              <div className="text-2xl">{getActivityIcon(activity.type)}</div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.message}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(activity.created_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {formatAddress(activity.user_address)}
                  </div>
                  {activity.amount && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {activity.amount} SHM
                    </div>
                  )}
                </div>
              </div>

              {activity.transaction_hash && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleViewOnExplorer(activity.transaction_hash)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-primary/10"
                  title="View on Explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </motion.button>
              )}
              
              <div className={`w-3 h-3 rounded-full ${getStatusColor(activity.status)}`} />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activities yet. Start using the platform to see live updates!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveActivityFeed;
