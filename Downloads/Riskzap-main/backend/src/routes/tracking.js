import express from 'express';
import UserInteraction from '../models/UserInteraction.js';
import User from '../models/User.js';
import { trackingLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to all tracking routes
router.use(trackingLimiter);

// Track user interaction
router.post('/interaction', async (req, res) => {
  try {
    const {
      walletAddress,
      interactionType,
      policyId,
      transactionHash,
      amount,
      tokenSymbol,
      metadata,
      sessionId
    } = req.body;

    if (!walletAddress || !interactionType) {
      return res.status(400).json({ 
        error: 'walletAddress and interactionType are required' 
      });
    }

    // Check for duplicate interactions (especially for purchases with transaction hashes)
    let interaction;
    if (transactionHash && interactionType === 'purchase_policy') {
      const existingInteraction = await UserInteraction.findOne({ 
        walletAddress, 
        transactionHash,
        interactionType: 'purchase_policy'
      });
      
      if (existingInteraction) {
        console.log('⚠️ Duplicate purchase interaction prevented for transaction:', transactionHash);
        return res.status(200).json({
          success: true,
          interaction: existingInteraction._id,
          message: 'Interaction already exists (duplicate prevented)'
        });
      }
    }

    // Create interaction record
    interaction = new UserInteraction({
      walletAddress,
      interactionType,
      policyId,
      transactionHash,
      amount,
      tokenSymbol,
      metadata,
      sessionId,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    await interaction.save();

    // Update or create user record (but don't double-count purchases)
    let user = await User.findOne({ walletAddress });
    
    if (!user) {
      user = new User({ 
        walletAddress,
        firstInteraction: new Date(),
        lastInteraction: new Date(),
        totalInteractions: 1
      });
    }

    // Only update purchase stats if this is NOT a duplicate purchase interaction
    const shouldUpdatePurchaseStats = !(transactionHash && interactionType === 'purchase_policy');
    await user.recordInteraction(interactionType, shouldUpdatePurchaseStats ? (amount || 0) : 0);

    res.status(201).json({
      success: true,
      interaction: interaction._id,
      message: 'Interaction tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

// Batch track multiple interactions
router.post('/interactions/batch', async (req, res) => {
  try {
    const { interactions } = req.body;

    if (!Array.isArray(interactions) || interactions.length === 0) {
      return res.status(400).json({
        error: 'interactions array is required and cannot be empty'
      });
    }

    if (interactions.length > 50) {
      return res.status(400).json({
        error: 'Maximum 50 interactions allowed per batch'
      });
    }

    const processedInteractions = [];
    const userUpdates = new Map();

    for (const interactionData of interactions) {
      const {
        walletAddress,
        interactionType,
        policyId,
        transactionHash,
        amount,
        tokenSymbol,
        metadata,
        sessionId
      } = interactionData;

      if (!walletAddress || !interactionType) {
        continue; // Skip invalid interactions
      }

      const interaction = new UserInteraction({
        walletAddress,
        interactionType,
        policyId,
        transactionHash,
        amount,
        tokenSymbol,
        metadata,
        sessionId,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });

      processedInteractions.push(interaction);

      // Aggregate user updates
      if (!userUpdates.has(walletAddress)) {
        userUpdates.set(walletAddress, {
          interactionCount: 0,
          totalSpent: 0,
          purchases: 0,
          lastInteraction: new Date()
        });
      }

      const userUpdate = userUpdates.get(walletAddress);
      userUpdate.interactionCount++;
      userUpdate.lastInteraction = new Date();

      if (interactionType === 'purchase_policy') {
        userUpdate.purchases++;
        userUpdate.totalSpent += amount || 0;
      }
    }

    // Save all interactions
    if (processedInteractions.length > 0) {
      await UserInteraction.insertMany(processedInteractions);
    }

    // Update user records
    for (const [walletAddress, updates] of userUpdates) {
      await User.findOneAndUpdate(
        { walletAddress },
        {
          $inc: { 
            totalInteractions: updates.interactionCount,
            totalPurchases: updates.purchases,
            totalSpent: updates.totalSpent
          },
          $set: { 
            lastInteraction: updates.lastInteraction,
            hasPurchased: updates.purchases > 0
          }
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({
      success: true,
      processed: processedInteractions.length,
      message: `${processedInteractions.length} interactions tracked successfully`
    });

  } catch (error) {
    console.error('Error batch tracking interactions:', error);
    res.status(500).json({ error: 'Failed to batch track interactions' });
  }
});

// Get user interaction history
router.get('/user/:walletAddress/history', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { limit = 50, offset = 0, type } = req.query;

    const query = { walletAddress };
    if (type) {
      query.interactionType = type;
    }

    const interactions = await UserInteraction.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await UserInteraction.countDocuments(query);

    res.json({
      interactions,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount > (parseInt(offset) + parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching interaction history:', error);
    res.status(500).json({ error: 'Failed to fetch interaction history' });
  }
});

export default router;