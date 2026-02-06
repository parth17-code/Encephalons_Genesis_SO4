const mongoose = require('mongoose');

const complianceRecordSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  week: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  complianceStatus: {
    type: String,
    enum: ['GREEN', 'YELLOW', 'RED'],
    required: true
  },
  rebatePercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  proofCount: {
    type: Number,
    default: 0
  },
  lastProofDate: {
    type: Date,
    default: null
  },
  daysSinceLastProof: {
    type: Number,
    default: 0
  },
  verifiedProofs: {
    type: Number,
    default: 0
  },
  flaggedProofs: {
    type: Number,
    default: 0
  },
  rejectedProofs: {
    type: Number,
    default: 0
  },
  complianceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for unique compliance records
complianceRecordSchema.index({ societyId: 1, year: 1, month: 1, week: 1 }, { unique: true });
complianceRecordSchema.index({ complianceStatus: 1 });

module.exports = mongoose.model('ComplianceRecord', complianceRecordSchema);