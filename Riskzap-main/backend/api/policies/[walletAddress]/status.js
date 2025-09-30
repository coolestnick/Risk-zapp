const { connectToDatabase } = require('../../../lib/db');
const { handleCors } = require('../../../lib/cors');

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database
    await connectToDatabase();
    
    // Lazy load models
    const User = require('../../../src/models/User');
    const Policy = require('../../../src/models/Policy');

    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }

    // Normalize wallet address to lowercase to match stored format
    const normalizedAddress = walletAddress.toLowerCase();

    // Get user info
    const user = await User.findOne({ walletAddress: normalizedAddress });

    // Get active policies
    const activePolicies = await Policy.find({
      walletAddress: normalizedAddress,
      status: 'active',
      isActive: true
    }).sort({ purchaseDate: -1 });

    // Get all policies (including inactive)
    const allPolicies = await Policy.find({ walletAddress: normalizedAddress })
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
}