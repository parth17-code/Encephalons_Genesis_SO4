const ProofLog = require('../models/ProofLog');
const Society = require('../models/Society');
const { generateImageHash, generateUniqueId } = require('../utils/helpers');
const { validateProof, uploadImageToCloud } = require('../services/validationService');
const { evaluateCompliance } = require('../services/complianceService');

/**
 * @route   POST /api/proof/upload
 * @desc    Upload waste segregation proof with security validations
 * @access  Private (SECRETARY)
 * 
 * Security Architecture:
 * 1. Server-side timestamp (client timestamps cannot be trusted)
 * 2. Image hash from raw buffer (not EXIF metadata)
 * 3. Geo-radius validation (500m tolerance)
 * 4. Duplicate detection via hash comparison
 * 5. Immutable proof log (no edits allowed)
 * 
 * This creates an auditable trail while deterring basic manipulation
 */
const uploadProof = async (req, res) => {
  try {
    const { societyId, geoLocation } = req.body;

    console.log(`📸 Proof upload initiated for society: ${societyId}`);

    // ============================================
    // SECURITY CHECK 1: Validate required fields
    // ============================================
    if (!societyId || !geoLocation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide societyId and geoLocation'
      });
    }

    // ============================================
    // SECURITY CHECK 2: Ensure image buffer exists
    // ============================================
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required. Please capture a photo.'
      });
    }

    // Validate buffer size (prevent empty or corrupted files)
    if (req.file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded image is empty or corrupted'
      });
    }

    console.log(`📦 Image buffer received: ${req.file.buffer.length} bytes`);

    // Parse geoLocation if it's a string
    let parsedGeoLocation = geoLocation;
    if (typeof geoLocation === 'string') {
      try {
        parsedGeoLocation = JSON.parse(geoLocation);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid geoLocation format'
        });
      }
    }

    // ============================================
    // SECURITY CHECK 3: Validate geolocation structure
    // ============================================
    if (!parsedGeoLocation.lat || !parsedGeoLocation.lng) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude required'
      });
    }

    // Validate coordinate ranges
    if (
      parsedGeoLocation.lat < -90 || parsedGeoLocation.lat > 90 ||
      parsedGeoLocation.lng < -180 || parsedGeoLocation.lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate values'
      });
    }

    // ============================================
    // Verify society exists and is active
    // ============================================
    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }

    if (!society.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Society is inactive'
      });
    }

    // ============================================
    // SECURITY: Generate hash from RAW buffer
    // ============================================
    // This hash is generated server-side from the actual image data
    // Cannot be spoofed by client, ignores EXIF metadata
    const imageHash = generateImageHash(req.file.buffer);
    console.log(`🔐 Generated image hash: ${imageHash.substring(0, 16)}...`);

    // ============================================
    // Upload image to Cloudinary (secure stream)
    // ============================================
    const { imageUrl } = await uploadImageToCloud(
      req.file.buffer,
      `${societyId}-${Date.now()}.jpg`
    );
    console.log(`☁️  Image uploaded to Cloudinary`);

    // ============================================
    // SECURITY: Server-side timestamp
    // ============================================
    // Client cannot manipulate this - set by server at upload time
    // This is the ONLY timestamp we trust
    const serverTimestamp = new Date();

    // Prepare proof data for validation
    const proofData = {
      geoLocation: parsedGeoLocation,
      timestamp: serverTimestamp,  // Server time only
      imageHash
    };

    // ============================================
    // SECURITY: Multi-layer validation
    // ============================================
    // 1. Geo-radius check (500m tolerance)
    // 2. Timestamp freshness (30 min window)
    // 3. Duplicate hash detection
    const validationResult = await validateProof(proofData, society);

    console.log(`🔍 Validation result: ${validationResult.status} - ${validationResult.reason}`);

    // ============================================
    // Create IMMUTABLE proof log
    // ============================================
    // Once created, this record cannot be edited
    // Ensures audit trail integrity
    const proofLog = await ProofLog.create({
      logId: generateUniqueId('PROOF-'),
      societyId,
      imageUrl,
      imageHash,
      timestamp: serverTimestamp,  // Server timestamp
      geoLocation: parsedGeoLocation,
      status: validationResult.status,
      validationReason: validationResult.reason,
      uploadedBy: req.user._id
    });

    console.log(`✅ Proof logged: ${proofLog.logId} | Status: ${proofLog.status}`);

    // ============================================
    // Trigger compliance evaluation (async)
    // ============================================
    // Don't wait for this - update compliance in background
    evaluateCompliance(societyId).catch(err => 
      console.error('⚠️  Compliance evaluation error:', err)
    );

    // ============================================
    // Return success response
    // ============================================
    res.status(201).json({
      success: true,
      data: {
        proof: proofLog,
        validation: validationResult
      }
    });

  } catch (error) {
    console.error('❌ Proof upload error:', error.message);
    
    // Don't expose internal errors to client
    res.status(500).json({
      success: false,
      message: 'Server error during proof upload'
    });
  }
};

/**
 * @route   GET /api/proof/society/:societyId
 * @desc    Get all proofs for a society
 * @access  Private
 */
const getSocietyProofs = async (req, res) => {
  try {
    const { societyId } = req.params;
    const { status, limit = 50 } = req.query;

    let query = { societyId };
    
    if (status) {
      query.status = status;
    }

    const proofs = await ProofLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('uploadedBy', 'name email')
      .populate('reviewedBy', 'name email');

    console.log(`📋 Retrieved ${proofs.length} proofs for society: ${societyId}`);

    res.json({
      success: true,
      count: proofs.length,
      data: proofs
    });
  } catch (error) {
    console.error('❌ Get proofs error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @route   GET /api/proof/:logId
 * @desc    Get single proof by ID
 * @access  Private
 */
const getProof = async (req, res) => {
  try {
    const proof = await ProofLog.findById(req.params.logId)
      .populate('societyId', 'name ward')
      .populate('uploadedBy', 'name email')
      .populate('reviewedBy', 'name email');

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Proof not found'
      });
    }

    res.json({
      success: true,
      data: proof
    });
  } catch (error) {
    console.error('❌ Get proof error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  uploadProof,
  getSocietyProofs,
  getProof
};