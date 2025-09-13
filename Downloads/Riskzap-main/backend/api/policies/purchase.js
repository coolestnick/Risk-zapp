const { connectToDatabase } = require('../../lib/db');
const { handleCors } = require('../../lib/cors');
const { rateLimit } = require('../../lib/rateLimit');
const Policy = require('../../src/models/Policy');
const User = require('../../src/models/User');
const UserInteraction = require('../../src/models/UserInteraction');

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 50 // 50 requests per minute
});

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Apply rate limiting
  limiter(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      // Connect to database
      await connectToDatabase();

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
      const existingPolicy = await Policy.findOne({ transactionHash });
      if (existingPolicy) {
        return res.status(409).json({ 
          error: 'Policy with this transaction hash already exists',
          policy: existingPolicy 
        });
      }

      // Generate unique policy ID
      const policyId = `POL_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

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
          ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
        });

        await interaction.save();
      }

      res.status(201).json({
        success: true,
        message: 'Policy purchased successfully',
        policy: {
          policyId: savedPolicy.policyId,
          transactionHash: savedPolicy.transactionHash,
          status: savedPolicy.status,
          purchaseDate: savedPolicy.purchaseDate
        }
      });

    } catch (error) {
      console.error('Error creating policy:', error);
      
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
}