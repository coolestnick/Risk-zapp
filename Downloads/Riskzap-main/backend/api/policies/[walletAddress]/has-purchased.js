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
}