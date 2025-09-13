const { connectToDatabase } = require('../lib/db');
const { handleCors } = require('../lib/cors');

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Connect to database
    await connectToDatabase();
    
    // Lazy load models
    const User = require('../src/models/User');
    const Policy = require('../src/models/Policy');

    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }

    // Get user data
    const user = await User.findOne({ walletAddress });
    const hasPurchased = user?.hasPurchased || false;

    // Double-check with Policy collection if user shows no purchases
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
}