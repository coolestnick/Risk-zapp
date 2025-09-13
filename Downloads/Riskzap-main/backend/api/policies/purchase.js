const { connectToDatabase } = require('../../lib/db');
const { handleCors } = require('../../lib/cors');

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Connect to database with retry mechanism
    let dbConnection;
    try {
      dbConnection = await connectToDatabase();
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return res.status(503).json({ 
        error: 'Database temporarily unavailable',
        retryAfter: '30 seconds'
      });
    }

    // Use raw database queries (crash-proof)
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;

    // Validate and extract request body with comprehensive error handling
    let requestData;
    try {
      requestData = req.body || {};
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }

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
    } = requestData;

    // Comprehensive input validation
    const missingFields = [];
    if (!walletAddress) missingFields.push('walletAddress');
    if (!policyName) missingFields.push('policyName');
    if (coverageAmount === undefined || coverageAmount === null) missingFields.push('coverageAmount');
    if (premiumAmount === undefined || premiumAmount === null) missingFields.push('premiumAmount');
    if (totalPaid === undefined || totalPaid === null) missingFields.push('totalPaid');
    if (!transactionHash) missingFields.push('transactionHash');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Type validation
    if (typeof coverageAmount !== 'number') {
      return res.status(400).json({ error: 'coverageAmount must be a number' });
    }
    if (typeof premiumAmount !== 'number') {
      return res.status(400).json({ error: 'premiumAmount must be a number' });
    }
    if (typeof totalPaid !== 'number') {
      return res.status(400).json({ error: 'totalPaid must be a number' });
    }

    // Check for duplicate transaction with crash protection
    let existingPolicy;
    try {
      existingPolicy = await db.collection('policies').findOne({ transactionHash });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({ error: 'Database query failed, please retry' });
    }

    if (existingPolicy) {
      return res.status(409).json({ 
        error: 'Policy with this transaction hash already exists',
        policy: {
          policyId: existingPolicy.policyId,
          status: existingPolicy.status,
          purchaseDate: existingPolicy.purchaseDate
        }
      });
    }

    // Generate unique policy ID
    const policyId = `POL_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create policy document with crash-proof structure
    const policyDocument = {
      policyId,
      walletAddress: walletAddress.toLowerCase(), // Normalize address
      policyType: policyType || 'basic',
      policyName: String(policyName).trim(),
      coverageAmount: Number(coverageAmount),
      premiumAmount: Number(premiumAmount),
      platformFee: Number(platformFee || 0),
      totalPaid: Number(totalPaid),
      tokenSymbol: tokenSymbol || 'SHM',
      transactionHash,
      blockNumber: blockNumber ? Number(blockNumber) : null,
      status: 'active',
      purchaseDate: new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      metadata: metadata || {},
      networkChainId: 8080,
      contractAddress: contractAddress || null,
      isActive: true,
      claimHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert policy with crash protection
    let savedPolicy;
    try {
      const insertResult = await db.collection('policies').insertOne(policyDocument);
      savedPolicy = { ...policyDocument, _id: insertResult.insertedId };
    } catch (insertError) {
      console.error('Policy insert error:', insertError);
      return res.status(500).json({ 
        error: 'Failed to save policy',
        details: insertError.code === 11000 ? 'Duplicate transaction hash' : 'Database write error'
      });
    }

    // Update user statistics with crash protection
    try {
      const userUpdate = await db.collection('users').updateOne(
        { walletAddress: walletAddress.toLowerCase() },
        {
          $inc: { 
            totalPurchases: 1,
            totalSpent: totalPaid,
            activePolicies: 1,
            totalInteractions: 1
          },
          $set: { 
            hasPurchased: true,
            lastInteraction: new Date(),
            updatedAt: new Date()
          },
          $setOnInsert: {
            walletAddress: walletAddress.toLowerCase(),
            createdAt: new Date(),
            firstInteraction: new Date(),
            isActive: true,
            metadata: {},
            preferredTokens: []
          }
        },
        { upsert: true }
      );
    } catch (userUpdateError) {
      console.error('User update error (non-critical):', userUpdateError);
      // Don't fail the request if user update fails
    }

    // Track interaction with crash protection
    try {
      const existingInteraction = await db.collection('userinteractions').findOne({ 
        walletAddress: walletAddress.toLowerCase(), 
        transactionHash,
        interactionType: 'purchase_policy'
      });
      
      if (!existingInteraction) {
        const interactionDocument = {
          walletAddress: walletAddress.toLowerCase(),
          interactionType: 'purchase_policy',
          policyId,
          transactionHash,
          amount: totalPaid,
          tokenSymbol: tokenSymbol || 'SHM',
          metadata: {
            policyName: String(policyName).trim(),
            coverageAmount: Number(coverageAmount),
            premiumAmount: Number(premiumAmount),
            platformFee: Number(platformFee || 0)
          },
          userAgent: req.headers['user-agent'] || 'unknown',
          ipAddress: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
          timestamp: new Date(),
          createdAt: new Date()
        };

        await db.collection('userinteractions').insertOne(interactionDocument);
      }
    } catch (interactionError) {
      console.error('Interaction tracking error (non-critical):', interactionError);
      // Don't fail the request if interaction tracking fails
    }

      // Return success response
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

  } catch (globalError) {
    console.error('Global error in purchase route:', globalError);
    
    // Comprehensive error response with crash protection
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    try {
      if (globalError.name === 'ValidationError') {
        errorMessage = 'Data validation failed';
        statusCode = 400;
      } else if (globalError.code === 11000) {
        errorMessage = 'Duplicate transaction detected';
        statusCode = 409;
      } else if (globalError.message?.includes('timeout')) {
        errorMessage = 'Request timeout - please retry';
        statusCode = 408;
      } else if (globalError.message?.includes('connection')) {
        errorMessage = 'Database connection failed';
        statusCode = 503;
      }
    } catch (errorProcessingError) {
      console.error('Error processing error:', errorProcessingError);
      // Use defaults
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? globalError.message : 'Please try again',
      timestamp: new Date().toISOString(),
      retryable: statusCode >= 500
    });
  }
}