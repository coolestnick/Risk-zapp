const { connectToDatabase } = require('../lib/db');
const { handleCors } = require('../lib/cors');
const { monitor, withMonitoring, withDbMonitoring } = require('../lib/monitoring');

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  return await withMonitoring(async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Connect to database with monitoring
    await withDbMonitoring(async () => {
      await connectToDatabase();
    });
    
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }

    // Use raw database queries with monitoring
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    // Get user data with crash protection
    const [user, policyCount] = await withDbMonitoring(async () => {
      const userQuery = db.collection('users').findOne({ walletAddress });
      const policyQuery = db.collection('policies').countDocuments({ walletAddress });
      return Promise.all([userQuery, policyQuery]);
    });
    
    const hasPurchased = user?.hasPurchased || policyCount > 0;

    res.json({ 
      hasPurchased,
      policies: user?.totalPurchases || policyCount || 0
    });

  }, 'has-purchased');
}