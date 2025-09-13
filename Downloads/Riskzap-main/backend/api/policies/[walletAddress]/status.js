import { connectToDatabase } from '../../../lib/db.js';
import { handleCors } from '../../../lib/cors.js';
import User from '../../../src/models/User.js';
import Policy from '../../../src/models/Policy.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database
    await connectToDatabase();

    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }

    // Get user info
    const user = await User.findOne({ walletAddress });
    
    // Get active policies
    const activePolicies = await Policy.find({ 
      walletAddress, 
      status: 'active',
      isActive: true 
    }).sort({ purchaseDate: -1 });
    
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
}