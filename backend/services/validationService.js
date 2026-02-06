const ProofLog = require('../models/ProofLog');
const Society = require('../models/Society');
const { isWithinRadius, isTimestampFresh } = require('../utils/helpers');
const cloudinary = require('../config/cloudinary'); 

/**
 * Validate proof submission
 */


const validateProof = async (proofData, societyData) => {
  const { geoLocation, timestamp, imageHash } = proofData;
  const validationResult = {
    status: 'VERIFIED',
    reason: 'All validation checks passed'
  };

  console.log('🔍 Starting proof validation...');

  // Check 1: Geo-radius validation
  const isValidLocation = isWithinRadius(
    geoLocation.lat,
    geoLocation.lng,
    societyData.geoLocation.lat,
    societyData.geoLocation.lng,
    0.5 // 500m radius
  );

  if (!isValidLocation) {
    validationResult.status = 'FLAGGED';
    validationResult.reason = 'Location is outside acceptable radius (500m)';
    console.log('⚠️  Location validation failed');
  }

  // Check 2: Timestamp freshness (within 30 minutes)
  const isFresh = isTimestampFresh(timestamp, 30);
  
  if (!isFresh) {
    validationResult.status = 'FLAGGED';
    validationResult.reason = validationResult.reason === 'All validation checks passed' 
      ? 'Timestamp is not fresh (>30 minutes old)'
      : validationResult.reason + '; Timestamp not fresh';
    console.log('⚠️  Timestamp validation failed');
  }

  // Check 3: Duplicate image hash
  const duplicateProof = await ProofLog.findOne({ imageHash });
  
  if (duplicateProof) {
    validationResult.status = 'REJECTED';
    validationResult.reason = 'Duplicate image detected. This proof was already submitted.';
    console.log('❌ Duplicate image detected');
  }

  if (validationResult.status === 'VERIFIED') {
    console.log('✅ Proof validation passed');
  }

  return validationResult;
};

/**
 * Mock image storage (simulates Cloudinary upload)
 */
const uploadImageToCloud = (buffer, fileName) => {
  return new Promise((resolve, reject) => {
    // Create upload stream to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'green-tax-proofs', // Organize images in folder
        public_id: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' } // Optimize quality/format
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error.message);
          return reject(new Error('Failed to upload image to cloud storage'));
        }
        
        console.log('☁️  Image uploaded to Cloudinary:', result.secure_url);
        resolve({ imageUrl: result.secure_url });
      }
    );

    // Pipe the buffer to Cloudinary stream
    const { Readable } = require('stream');
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

module.exports = {
  validateProof,
  uploadImageToCloud
};