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

    // Normalize wallet address to lowercase to match stored format
    const normalizedAddress = walletAddress.toLowerCase();

    // Get user data
    const user = await User.findOne({ walletAddress: normalizedAddress });

    // Get all policies for this wallet
    const policies = await Policy.find({ walletAddress: normalizedAddress }).sort({ purchaseDate: -1 });
    
    // Calculate summary statistics
    const totalPurchases = policies.length;
    const activePolicies = policies.filter(p => p.status === 'active').length;
    const totalSpent = policies.reduce((sum, p) => sum + (p.totalPaid || 0), 0);
    
    // Get latest policy
    const latestPolicy = policies[0] || null;

    res.json({
      walletAddress,
      hasPurchased: totalPurchases > 0,
      totalPurchases,
      activePolicies,
      totalSpent,
      tokenSymbol: 'SHM',
      latestPolicy: latestPolicy ? {
        policyId: latestPolicy.policyId,
        policyName: latestPolicy.policyName,
        coverageAmount: latestPolicy.coverageAmount,
        status: latestPolicy.status,
        purchaseDate: latestPolicy.purchaseDate
      } : null,
      policies: policies.map(p => ({
        policyId: p.policyId,
        policyName: p.policyName,
        policyType: p.policyType,
        coverageAmount: p.coverageAmount,
        premiumAmount: p.premiumAmount,
        totalPaid: p.totalPaid,
        status: p.status,
        purchaseDate: p.purchaseDate,
        expiryDate: p.expiryDate,
        transactionHash: p.transactionHash
      })),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({ error: 'Failed to get user status' });
  }
}