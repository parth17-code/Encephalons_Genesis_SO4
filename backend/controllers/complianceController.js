const { evaluateCompliance, calculateRebate, getResidentSummary } = require('../services/complianceService');
const ComplianceRecord = require('../models/ComplianceRecord');
const Society = require('../models/Society');
;
/**
 * @route   POST /api/compliance/evaluate
 * @desc    Evaluate compliance for a society
 * @access  Private (BMC_ADMIN, SECRETARY)
 */

const evaluate = async (req, res) => {
  try {
    const { societyId } = req.body;

    console.log(`📊 Evaluating compliance for: ${societyId}`);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide societyId'
      });
    }

    const complianceRecord = await evaluateCompliance(societyId);

    res.json({
      success: true,
      data: complianceRecord
    });
  } catch (error) {
    console.error('❌ Compliance evaluation error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @route   GET /api/rebate/:societyId
 * @desc    Get rebate calculation for society
 * @access  Private
 */
const getRebate = async (req, res) => {
  try {
    const { societyId } = req.params;

    console.log(`💰 Calculating rebate for: ${societyId}`);

    const rebateData = await calculateRebate(societyId);

    res.json({
      success: true,
      data: rebateData
    });
  } catch (error) {
    console.error('❌ Rebate calculation error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @route   GET /api/resident/society/:societyId/summary
 * @desc    Get society summary for resident view
 * @access  Private (RESIDENT, SECRETARY)
 */
const getSocietySummary = async (req, res) => {
  try {
    const { societyId } = req.params;

    console.log(`📊 Fetching resident summary for: ${societyId}`);

    const summary = await getResidentSummary(societyId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('❌ Get summary error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @route   GET /api/heatmap/ward
 * @desc    Get heatmap data aggregated by ward
 * @access  Private (BMC_ADMIN)
 */
const getHeatmapData = async (req, res) => {
  try {
    console.log('🗺️  Generating heatmap data');

    // Get all active societies with their latest compliance
    const societies = await Society.find({ isActive: true }).lean();

    const heatmapData = await Promise.all(
      societies.map(async (society) => {
        const latestCompliance = await ComplianceRecord.findOne({ societyId: society._id })
          .sort({ year: -1, month: -1, week: -1 });

        const complianceScore = latestCompliance ? latestCompliance.complianceScore : 0;

        return {
          ward: society.ward,
          societyName: society.name,
          lat: society.geoLocation.lat,
          lng: society.geoLocation.lng,
          complianceScore,
          complianceStatus: latestCompliance ? latestCompliance.complianceStatus : 'RED',
          rebatePercent: latestCompliance ? latestCompliance.rebatePercent : 0
        };
      })
    );

    // Aggregate by ward
    const wardAggregation = heatmapData.reduce((acc, item) => {
      if (!acc[item.ward]) {
        acc[item.ward] = {
          ward: item.ward,
          societies: [],
          avgComplianceScore: 0,
          totalSocieties: 0,
          greenCount: 0,
          yellowCount: 0,
          redCount: 0
        };
      }

      acc[item.ward].societies.push(item);
      acc[item.ward].totalSocieties++;
      acc[item.ward].avgComplianceScore += item.complianceScore;

      if (item.complianceStatus === 'GREEN') acc[item.ward].greenCount++;
      if (item.complianceStatus === 'YELLOW') acc[item.ward].yellowCount++;
      if (item.complianceStatus === 'RED') acc[item.ward].redCount++;

      return acc;
    }, {});

    // Calculate averages
    Object.keys(wardAggregation).forEach(ward => {
      const data = wardAggregation[ward];
      data.avgComplianceScore = Math.round(data.avgComplianceScore / data.totalSocieties);
    });

    console.log(`✅ Heatmap data generated for ${Object.keys(wardAggregation).length} wards`);

    res.json({
      success: true,
      data: {
        societies: heatmapData,
        wardSummary: Object.values(wardAggregation)
      }
    });
  } catch (error) {
    console.error('❌ Heatmap error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  evaluate,
  getRebate,
  getSocietySummary,
  getHeatmapData
};