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
    
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }

    // Use raw database queries (more reliable in serverless)
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    // Get user data
    const user = await db.collection('users').findOne({ walletAddress });
    const policyCount = await db.collection('policies').countDocuments({ walletAddress });
    
    const hasPurchased = user?.hasPurchased || policyCount > 0;

    res.json({ 
      hasPurchased,
      policies: user?.totalPurchases || policyCount || 0
    });

  } catch (error) {
    console.error('Error checking purchase status:', error);
    res.status(500).json({ error: 'Failed to check purchase status' });
  }
}