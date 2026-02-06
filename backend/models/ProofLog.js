const mongoose = require('mongoose');

const proofLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  imageHash: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  geoLocation: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['VERIFIED', 'FLAGGED', 'REJECTED'],
    default: 'VERIFIED'
  },
  validationReason: {
    type: String,
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Make collection append-only (prevent updates)
proofLogSchema.pre('updateOne', function(next) {
  next(new Error('ProofLog is immutable. Updates are not allowed.'));
});

proofLogSchema.pre('findOneAndUpdate', function(next) {
  // Allow only status updates by admin
  const update = this.getUpdate();
  if (Object.keys(update).some(key => !['status', 'reviewedBy', 'reviewedAt', 'validationReason'].includes(key))) {
    next(new Error('ProofLog is immutable. Only status reviews are allowed.'));
  }
  next();
});

// Index for efficient queries
proofLogSchema.index({ societyId: 1, timestamp: -1 });
proofLogSchema.index({ status: 1 });
proofLogSchema.index({ imageHash: 1 });

module.exports = mongoose.model('ProofLog', proofLogSchema);