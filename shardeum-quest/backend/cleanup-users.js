require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function cleanupDuplicateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shardeumquest', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Find all users with empty usernames and remove duplicates
    const usersWithEmptyUsername = await User.find({ username: { $in: ["", null] } });
    console.log(`Found ${usersWithEmptyUsername.length} users with empty usernames`);
    
    // Keep only the first one, delete the rest
    for (let i = 1; i < usersWithEmptyUsername.length; i++) {
      await User.findByIdAndDelete(usersWithEmptyUsername[i]._id);
      console.log(`Deleted duplicate user: ${usersWithEmptyUsername[i]._id}`);
    }
    
    // Update remaining users with empty username to null
    await User.updateMany(
      { username: "" }, 
      { $set: { username: null } }
    );
    
    console.log('✅ Cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupDuplicateUsers();