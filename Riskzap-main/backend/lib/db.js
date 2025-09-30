const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

let isConnected = false;
let connectionPromise = null;

async function connectToDatabase(retryCount = 3) {
  // Return existing connection if available
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Return existing connection attempt
  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  connectionPromise = attemptConnection(mongoUri, retryCount);
  
  try {
    const result = await connectionPromise;
    connectionPromise = null;
    return result;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
}

async function attemptConnection(mongoUri, retryCount) {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`🔄 MongoDB connection attempt ${attempt}/${retryCount}`);
      
      const db = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        socketTimeoutMS: 45000, // 45 second socket timeout
        maxPoolSize: 10, // Connection pooling
        retryWrites: true,
        retryReads: true
      });
      
      isConnected = true;
      console.log('✅ MongoDB Connected successfully');
      
      // Set up connection event listeners
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        isConnected = false;
      });
      
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        isConnected = false;
      });
      
      return db.connection;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === retryCount) {
        throw new Error(`Failed to connect to MongoDB after ${retryCount} attempts: ${error.message}`);
      }
      
      // Wait before retry with exponential backoff
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Graceful disconnect for serverless
async function disconnectFromDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase
};