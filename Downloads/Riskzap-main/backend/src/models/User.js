import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstInteraction: {
    type: Date,
    default: Date.now
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  totalInteractions: {
    type: Number,
    default: 0
  },
  hasPurchased: {
    type: Boolean,
    default: false
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  activePolicies: {
    type: Number,
    default: 0
  },
  preferredTokens: [{
    type: String
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Update lastInteraction and totalInteractions when user interacts
userSchema.methods.recordInteraction = function(interactionType, amount = 0) {
  this.lastInteraction = new Date();
  this.totalInteractions += 1;
  
  if (interactionType === 'purchase_policy') {
    this.hasPurchased = true;
    this.totalPurchases += 1;
    this.totalSpent += amount;
  }
  
  return this.save();
};

export default mongoose.model('User', userSchema);