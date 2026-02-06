const mongoose = require('mongoose');

const societySchema = new mongoose.Schema({
  societyId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  ward: {
    type: String,
    required: true
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
  propertyTaxNumber: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    default: ''
  },
  totalUnits: {
    type: Number,
    default: 0
  },
  contactEmail: {
    type: String
  },
  contactPhone: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for geospatial queries
societySchema.index({ 'geoLocation.lat': 1, 'geoLocation.lng': 1 });

module.exports = mongoose.model('Society', societySchema);