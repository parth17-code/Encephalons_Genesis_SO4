const Society = require('../models/Society');
const { generateUniqueId } = require('../utils/helpers');

/**
 * @route   POST /api/society/register
 * @desc    Register new society
 * @access  Private (BMC_ADMIN)
 */
const registerSociety = async (req, res) => {
  try {
    const { name, ward, geoLocation, propertyTaxNumber, address, totalUnits, contactEmail, contactPhone } = req.body;

    console.log(`🏢 Registering new society: ${name}`);

    // Validate required fields
    if (!name || !ward || !geoLocation || !propertyTaxNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, ward, geoLocation, propertyTaxNumber'
      });
    }

    // Check if property tax number already exists
    const existingSociety = await Society.findOne({ propertyTaxNumber });
    if (existingSociety) {
      return res.status(400).json({
        success: false,
        message: 'Society with this property tax number already exists'
      });
    }

    // Create society
    const society = await Society.create({
      societyId: generateUniqueId('SOC-'),
      name,
      ward,
      geoLocation,
      propertyTaxNumber,
      address: address || '',
      totalUnits: totalUnits || 0,
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || ''
    });

    console.log(`✅ Society registered: ${name} (ID: ${society.societyId})`);

    res.status(201).json({
      success: true,
      data: society
    });
  } catch (error) {
    console.error('❌ Society registration error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during society registration'
    });
  }
};

/**
 * @route   GET /api/society/:societyId
 * @desc    Get society details
 * @access  Private
 */
const getSociety = async (req, res) => {
  try {
    const society = await Society.findById(req.params.societyId);

    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }

    console.log(`📋 Retrieved society: ${society.name}`);

    res.json({
      success: true,
      data: society
    });
  } catch (error) {
    console.error('❌ Get society error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @route   GET /api/society
 * @desc    Get all societies (with filters)
 * @access  Private (BMC_ADMIN)
 */
const getAllSocieties = async (req, res) => {
  try {
    const { ward, status } = req.query;
    
    let query = {};
    
    if (ward) {
      query.ward = ward;
    }
    
    if (status !== undefined) {
      query.isActive = status === 'active';
    }

    const societies = await Society.find(query).sort({ name: 1 });

    console.log(`📋 Retrieved ${societies.length} societies`);

    res.json({
      success: true,
      count: societies.length,
      data: societies
    });
  } catch (error) {
    console.error('❌ Get societies error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

  const getPublicSocieties = async (req, res) => {
  try {
    console.log('📋 Fetching public society list for registration');

    // Only return minimal data - name and _id
    const societies = await Society.find({ isActive: true })
      .select('_id name ward')
      .sort({ name: 1 })
      .lean();

    console.log(`✅ Retrieved ${societies.length} active societies`);

    res.json({
      success: true,
      count: societies.length,
      data: societies
    });
  } catch (error) {
    console.error('❌ Get public societies error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  registerSociety,
  getSociety,
  getAllSocieties,
  getPublicSocieties
};