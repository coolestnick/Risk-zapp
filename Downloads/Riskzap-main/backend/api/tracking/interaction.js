const { connectToDatabase } = require('../../lib/db');
const { handleCors } = require('../../lib/cors');

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Connect to database
    await connectToDatabase();
    
    // Lazy load models
    const UserInteraction = require('../../src/models/UserInteraction');
    const User = require('../../src/models/User');

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
        ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
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
}