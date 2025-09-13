import express from 'express';
import UserInteraction from '../models/UserInteraction.js';
import User from '../models/User.js';

const router = express.Router();

// Get user analytics by wallet address
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const interactions = await UserInteraction.find({ walletAddress })
      .sort({ timestamp: -1 })
      .limit(100);

    const interactionSummary = await UserInteraction.aggregate([
      { $match: { walletAddress } },
      { $group: {
          _id: '$interactionType',
          count: { $sum: 1 },
          lastInteraction: { $max: '$timestamp' }
        }
      }
    ]);

    res.json({
      user,
      interactionSummary,
      recentInteractions: interactions
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overall platform analytics
router.get('/platform', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastInteraction: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });
    const purchasedUsers = await User.countDocuments({ hasPurchased: true });

    const interactionStats = await UserInteraction.aggregate([
      { $group: {
          _id: '$interactionType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const dailyStats = await UserInteraction.aggregate([
      { $match: {
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }
      },
      { $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            type: "$interactionType"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": -1 } }
    ]);

    res.json({
      totalUsers,
      activeUsers,
      purchasedUsers,
      conversionRate: totalUsers > 0 ? (purchasedUsers / totalUsers * 100).toFixed(2) : 0,
      interactionStats,
      dailyStats
    });
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;