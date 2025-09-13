import mongoose from 'mongoose';

const userInteractionSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  interactionType: {
    type: String,
    required: true,
    enum: [
      'connect_wallet',
      'view_policies',
      'purchase_policy',
      'claim_policy',
      'cancel_policy',
      'view_dashboard',
      'view_analytics',
      'deposit_funds',
      'withdraw_funds',
      'visit_page'
    ]
  },
  policyId: {
    type: String,
    required: false
  },
  transactionHash: {
    type: String,
    required: false
  },
  amount: {
    type: Number,
    required: false
  },
  tokenSymbol: {
    type: String,
    required: false,
    default: 'SHM'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userAgent: {
    type: String,
    required: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  sessionId: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
userInteractionSchema.index({ walletAddress: 1, timestamp: -1 });
userInteractionSchema.index({ interactionType: 1, timestamp: -1 });
userInteractionSchema.index({ walletAddress: 1, interactionType: 1 });

export default mongoose.model('UserInteraction', userInteractionSchema);