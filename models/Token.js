const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster querying
tokenSchema.index({ user: 1 });
tokenSchema.index({ refreshToken: 1 }, { unique: true });

// Add TTL for automatic token expiration
tokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 } // Document will be deleted when expiresAt is in the past
);

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
