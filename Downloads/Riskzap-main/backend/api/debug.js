const { connectToDatabase } = require('../lib/db');
const { handleCors } = require('../lib/cors');

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }

    // Connect to database
    await connectToDatabase();
    
    // Import mongoose to run raw queries
    const mongoose = require('mongoose');
    
    // Raw database queries to debug
    const db = mongoose.connection.db;
    
    // Check collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Try raw queries
    let userQuery = null;
    let policyQuery = null;
    let userCount = 0;
    let policyCount = 0;
    
    try {
      userCount = await db.collection('users').countDocuments({ walletAddress });
      userQuery = await db.collection('users').findOne({ walletAddress });
    } catch (e) {
      userQuery = { error: e.message };
    }
    
    try {
      policyCount = await db.collection('policies').countDocuments({ walletAddress });
      policyQuery = await db.collection('policies').find({ walletAddress }).toArray();
    } catch (e) {
      policyQuery = { error: e.message };
    }

    res.json({
      walletAddress,
      collections: collectionNames,
      userCount,
      policyCount,
      userQuery,
      policyQuery: policyQuery.length > 10 ? `${policyQuery.length} policies found` : policyQuery,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: 'Debug failed',
      details: error.message,
      stack: error.stack
    });
  }
}