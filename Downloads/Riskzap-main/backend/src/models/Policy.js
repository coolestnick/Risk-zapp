const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  policyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  policyType: {
    type: String,
    required: true,
    enum: ['basic', 'premium', 'enterprise', 'custom', 'health-micro', 'health-standard', 'health-premium', 'travel-insurance', 'device-protection', 'cyber-security', 'event-coverage', 'freelancer-protection']
  },
  policyName: {
    type: String,
    required: true
  },
  coverageAmount: {
    type: Number,
    required: true
  },
  premiumAmount: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    required: true,
    default: 0
  },
  totalPaid: {
    type: Number,
    required: true
  },
  tokenSymbol: {
    type: String,
    required: true,
    default: 'SHM'
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  blockNumber: {
    type: Number,
    required: false
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'expired', 'claimed', 'cancelled'],
    default: 'active'
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: false
  },
  claimHistory: [{
    claimId: String,
    claimDate: Date,
    claimAmount: Number,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid']
    },
    transactionHash: String
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  networkChainId: {
    type: Number,
    default: 8080
  },
  contractAddress: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
policySchema.index({ walletAddress: 1, status: 1 });
policySchema.index({ walletAddress: 1, purchaseDate: -1 });
policySchema.index({ status: 1, expiryDate: 1 });

// Methods
policySchema.methods.addClaim = function(claimData) {
  this.claimHistory.push(claimData);
  return this.save();
};

policySchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  if (newStatus === 'cancelled' || newStatus === 'expired') {
    this.isActive = false;
  }
  return this.save();
};

// Static methods
policySchema.statics.findActiveByWallet = function(walletAddress) {
  return this.find({ 
    walletAddress, 
    status: 'active',
    isActive: true 
  }).sort({ purchaseDate: -1 });
};

policySchema.statics.findByTransactionHash = function(transactionHash) {
  return this.findOne({ transactionHash });
};

module.exports = mongoose.model('Policy', policySchema);