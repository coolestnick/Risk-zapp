import express from 'express';
import Policy from '../models/Policy.js';
import User from '../models/User.js';
import UserInteraction from '../models/UserInteraction.js';
import { trackingLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to policy routes
router.use(trackingLimiter);

// Create a new policy (called when user purchases)
router.post('/purchase', async (req, res) => {
  try {
    const {
      walletAddress,
      policyType,
      policyName,
      coverageAmount,
      premiumAmount,
      platformFee,
      totalPaid,
      tokenSymbol,
      transactionHash,
      blockNumber,
      expiryDate,
      metadata,
      contractAddress
    } = req.body;

    if (!walletAddress || !policyName || !coverageAmount || !premiumAmount || !totalPaid || !transactionHash) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, policyName, coverageAmount, premiumAmount, totalPaid, transactionHash' 
      });
    }

    // Check if policy with this transaction hash already exists
    const existingPolicy = await Policy.findByTransactionHash(transactionHash);
    if (existingPolicy) {
      return res.status(409).json({ 
        error: 'Policy with this transaction hash already exists',
        policy: existingPolicy 
      });
    }

    // Generate unique policy ID
    const policyId = `POL_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    console.log('🏗️ Creating policy with ID:', policyId);
    console.log('📊 Policy data:', { walletAddress, policyName, coverageAmount, premiumAmount, totalPaid });

    // Create new policy
    const policy = new Policy({
      policyId,
      walletAddress,
      policyType: policyType || 'basic',
      policyName,
      coverageAmount,
      premiumAmount,
      platformFee: platformFee || 0,
      totalPaid,
      tokenSymbol: tokenSymbol || 'SHM',
      transactionHash,
      blockNumber,
      expiryDate,
      metadata: metadata || {},
      contractAddress
    });

    const savedPolicy = await policy.save();
    console.log('✅ Policy saved successfully:', savedPolicy.policyId);

    // Update user statistics
    await User.findOneAndUpdate(
      { walletAddress },
      {
        $inc: { 
          totalPurchases: 1,
          totalSpent: totalPaid,
          activePolicies: 1
        },
        $set: { 
          hasPurchased: true,
          lastInteraction: new Date()
        }
      },
      { upsert: true, new: true }
    );

    // Track the interaction (check for duplicates first)
    const existingInteraction = await UserInteraction.findOne({ 
      walletAddress, 
      transactionHash,
      interactionType: 'purchase_policy'
    });
    
    if (!existingInteraction) {
      const interaction = new UserInteraction({
        walletAddress,
        interactionType: 'purchase_policy',
        policyId,
        transactionHash,
        amount: totalPaid,
        tokenSymbol: tokenSymbol || 'SHM',
        metadata: {
          policyName,
          coverageAmount,
          premiumAmount,
          platformFee
        },
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });

      await interaction.save();
      console.log('✅ Purchase interaction tracked for policy:', policyId);
    } else {
      console.log('⚠️ Purchase interaction already exists for transaction:', transactionHash);
    }

    res.status(201).json({
      success: true,
      message: 'Policy purchased successfully',
      policy: {
        policyId: policy.policyId,
        transactionHash: policy.transactionHash,
        status: policy.status,
        purchaseDate: policy.purchaseDate
      }
    });

  } catch (error) {
    console.error('Error creating policy:', error);
    
    // More detailed error response
    let errorMessage = 'Failed to create policy';
    if (error.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate transaction hash - policy may already exist';
    }
    
    res.status(500).json({ 
      error: errorMessage, 
      details: error.message,
      type: error.name
    });
  }
});

// Check if user has purchased any policies
router.get('/user/:walletAddress/status', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    // Get user info
    const user = await User.findOne({ walletAddress });
    
    // Get active policies
    const activePolicies = await Policy.findActiveByWallet(walletAddress);
    
    // Get all policies (including inactive)
    const allPolicies = await Policy.find({ walletAddress })
      .sort({ purchaseDate: -1 });

    const response = {
      walletAddress,
      hasPurchased: user?.hasPurchased || false,
      totalPurchases: user?.totalPurchases || 0,
      activePolicies: activePolicies.length,
      totalPolicies: allPolicies.length,
      totalSpent: user?.totalSpent || 0,
      policies: activePolicies.map(policy => ({
        policyId: policy.policyId,
        policyName: policy.policyName,
        coverageAmount: policy.coverageAmount,
        status: policy.status,
        purchaseDate: policy.purchaseDate,
        transactionHash: policy.transactionHash
      })),
      lastPurchase: allPolicies.length > 0 ? allPolicies[0].purchaseDate : null
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching user policy status:', error);
    res.status(500).json({ error: 'Failed to fetch policy status' });
  }
});

// Get all policies for a user
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    const query = { walletAddress };
    if (status) {
      query.status = status;
    }

    const policies = await Policy.find(query)
      .sort({ purchaseDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await Policy.countDocuments(query);

    res.json({
      policies,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount > (parseInt(offset) + parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching user policies:', error);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// Get specific policy by ID
router.get('/:policyId', async (req, res) => {
  try {
    const { policyId } = req.params;

    const policy = await Policy.findOne({ policyId });
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json(policy);

  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

// Update policy status
router.patch('/:policyId/status', async (req, res) => {
  try {
    const { policyId } = req.params;
    const { status, walletAddress } = req.body;

    if (!status || !walletAddress) {
      return res.status(400).json({ 
        error: 'Status and walletAddress are required' 
      });
    }

    const validStatuses = ['active', 'expired', 'claimed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const policy = await Policy.findOne({ policyId, walletAddress });
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    await policy.updateStatus(status);

    // Update user active policies count
    if (status === 'cancelled' || status === 'expired') {
      await User.findOneAndUpdate(
        { walletAddress },
        { $inc: { activePolicies: -1 } }
      );
    }

    res.json({
      success: true,
      message: 'Policy status updated',
      policy: {
        policyId: policy.policyId,
        status: policy.status,
        isActive: policy.isActive
      }
    });

  } catch (error) {
    console.error('Error updating policy status:', error);
    res.status(500).json({ error: 'Failed to update policy status' });
  }
});

// Check if user has purchased policies (simple true/false endpoint)
router.get('/user/:walletAddress/has-purchased', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const user = await User.findOne({ walletAddress });
    const hasPurchased = user?.hasPurchased || false;
    
    // Double-check by looking for actual policies
    if (!hasPurchased) {
      const policyCount = await Policy.countDocuments({ walletAddress });
      if (policyCount > 0) {
        // Update user record if there's a mismatch
        await User.findOneAndUpdate(
          { walletAddress },
          { hasPurchased: true },
          { upsert: true }
        );
        return res.json({ hasPurchased: true, policies: policyCount });
      }
    }

    res.json({ 
      hasPurchased,
      policies: user?.totalPurchases || 0 
    });

  } catch (error) {
    console.error('Error checking purchase status:', error);
    res.status(500).json({ error: 'Failed to check purchase status' });
  }
});

export default router;