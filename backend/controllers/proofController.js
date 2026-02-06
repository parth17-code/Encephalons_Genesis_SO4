const ProofLog = require('../models/ProofLog');
const Society = require('../models/Society');
const { generateImageHash, generateUniqueId } = require('../utils/helpers');
const { validateProof, uploadImageToCloud } = require('../services/validationService');
const { evaluateCompliance } = require('../services/complianceService');



/**
 * @route   POST /api/proof/upload
 * @desc    Upload waste segregation proof
 * @access  Private (SECRETARY)
 * 
 * 
 */

const uploadProof = async (req, res) => {
  try {
    const { societyId, geoLocation } = req.body;

    console.log(`📸 Proof upload initiated for society: ${societyId}`);

    // Validate required fields
    if (!societyId || !geoLocation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide societyId and geoLocation'
      });
    }

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Parse geoLocation if it's a string
    let parsedGeoLocation = geoLocation;
    if (typeof geoLocation === 'string') {
      parsedGeoLocation = JSON.parse(geoLocation);
    }

    // Verify society exists
    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }

    // Generate image hash for duplicate detection
    const imageHash = generateImageHash(req.file.buffer);

    // Upload image to Cloudinary - destructure imageUrl from result
    const { imageUrl } = await uploadImageToCloud(
      req.file.buffer,
      `${societyId}-${Date.now()}.jpg`
    );

    // Prepare proof data for validation
    const proofData = {
      geoLocation: parsedGeoLocation,
      timestamp: new Date(),
      imageHash
    };

    // Validate proof (location, timestamp, duplicates)
    const validationResult = await validateProof(proofData, society);

    // Create immutable proof log
    const proofLog = await ProofLog.create({
      logId: generateUniqueId('PROOF-'),
      societyId,
      imageUrl,
      imageHash,
      timestamp: proofData.timestamp,
      geoLocation: parsedGeoLocation,
      status: validationResult.status,
      validationReason: validationResult.reason,
      uploadedBy: req.user._id
    });

    console.log(`✅ Proof uploaded: ${proofLog.logId} | Status: ${proofLog.status}`);

    // Trigger compliance evaluation asynchronously
    evaluateCompliance(societyId).catch(err => 
      console.error('Compliance evaluation error:', err)
    );

    res.status(201).json({
      success: true,
      data: {
        proof: proofLog,
        validation: validationResult
      }
    });
  } catch (error) {
    console.error('❌ Proof upload error:', error.message);
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