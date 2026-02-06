const ProofLog = require('../models/ProofLog');
const Society = require('../models/Society');
const ComplianceRecord = require('../models/ComplianceRecord');
const { evaluateCompliance } = require('../services/complianceService');

/**
 * @route   GET /api/admin/societies
 * @desc    Get all societies with filters
 * @access  Private (BMC_ADMIN)
 */
const getSocietiesAdmin = async (req, res) => {
  try {
    const { ward, complianceStatus } = req.query;

    console.log(`🏛️ Admin fetching societies | Ward: ${ward || 'All'} | Status: ${complianceStatus || 'All'}`);

    // Build query for societies
    let societyQuery = { isActive: true };
    if (ward) {
      societyQuery.ward = ward;
    }

    const societies = await Society.find(societyQuery).lean();

    // Get latest compliance for each society
    const societiesWithCompliance = await Promise.all(
      societies.map(async (society) => {
        const latestCompliance = await ComplianceRecord.findOne({ societyId: society._id })
          .sort({ year: -1, month: -1, week: -1 });

        return {
          ...society,
          compliance: latestCompliance || {
            complianceStatus: 'RED',
            rebatePercent: 0,
            proofCount: 0
          }
        };
      })
    );

    // Filter by compliance status if provided
    let filteredSocieties = societiesWithCompliance;
    if (complianceStatus) {
      filteredSocieties = societiesWithCompliance.filter(
        s => s.compliance.complianceStatus === complianceStatus
      );
    }

    console.log(`✅ Retrieved ${filteredSocieties.length} societies`);

    res.json({
      success: true,
      count: filteredSocieties.length,
      data: filteredSocieties
    });
  } catch (error) {
    console.error('❌ Admin get societies error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @route   POST /api/admin/proof/:logId/approve
 * @desc    Approve a flagged proof
 * @access  Private (BMC_ADMIN)
 */
const approveProof = async (req, res) => {
  try {
    const { logId } = req.params;

    console.log(`✅ Admin approving proof: ${logId}`);

    const proof = await ProofLog.findByIdAndUpdate(
      logId,
      {
        status: 'VERIFIED',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        validationReason: 'Manually approved by BMC admin'
      },
      { new: true }
    ).populate('societyId', 'name ward');

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Proof not found'
      });
    }

    // Re-evaluate compliance after approval
    await evaluateCompliance(proof.societyId._id);

    console.log(`✅ Proof approved: ${logId}`);

    res.json({
      success: true,
      message: 'Proof approved successfully',
      data: proof
    });
  } catch (error) {
    console.error('❌ Approve proof error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @route   POST /api/admin/proof/:logId/reject
 * @desc    Reject a proof
 * @access  Private (BMC_ADMIN)
 */
const rejectProof = async (req, res) => {
  try {
    const { logId } = req.params;
    const { reason } = req.body;

    console.log(`❌ Admin rejecting proof: ${logId}`);

    const proof = await ProofLog.findByIdAndUpdate(
      logId,
      {
        status: 'REJECTED',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        validationReason: reason || 'Rejected by BMC admin'
      },
      { new: true }
    ).populate('societyId', 'name ward');

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Proof not found'
      });
    }

    // Re-evaluate compliance after rejection
    await evaluateCompliance(proof.societyId._id);

    console.log(`❌ Proof rejected: ${logId}`);

    res.json({
      success: true,
      message: 'Proof rejected successfully',
      data: proof
    });
  } catch (error) {
    console.error('❌ Reject proof error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (BMC_ADMIN)
 */
const getDashboard = async (req, res) => {
  try {
    console.log('📊 Fetching admin dashboard data');

    // Total societies
    const totalSocieties = await Society.countDocuments({ isActive: true });

    // Compliance breakdown
    const latestComplianceRecords = await ComplianceRecord.aggregate([
      {
        $sort: { societyId: 1, year: -1, month: -1, week: -1 }
      },
      {
        $group: {
          _id: '$societyId',
          latestRecord: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestRecord' }
      }
    ]);

    const complianceBreakdown = {
      GREEN: latestComplianceRecords.filter(r => r.complianceStatus === 'GREEN').length,
      YELLOW: latestComplianceRecords.filter(r => r.complianceStatus === 'YELLOW').length,
      RED: latestComplianceRecords.filter(r => r.complianceStatus === 'RED').length
    };

    // Total proofs
    const totalProofs = await ProofLog.countDocuments();
    const verifiedProofs = await ProofLog.countDocuments({ status: 'VERIFIED' });
    const flaggedProofs = await ProofLog.countDocuments({ status: 'FLAGGED' });
    const rejectedProofs = await ProofLog.countDocuments({ status: 'REJECTED' });

    // Ward-wise breakdown
    const wardBreakdown = await Society.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$ward', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const dashboardData = {
      totalSocieties,
      complianceBreakdown,
      proofStats: {
        total: totalProofs,
        verified: verifiedProofs,
        flagged: flaggedProofs,
        rejected: rejectedProofs
      },
      wardBreakdown
    };

    console.log('✅ Dashboard data retrieved');

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('❌ Dashboard error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @route   GET /api/admin/proofs/pending
 * @desc    Get all flagged proofs pending review
 * @access  Private (BMC_ADMIN)
 */
const getPendingProofs = async (req, res) => {
  try {
    const pendingProofs = await ProofLog.find({ status: 'FLAGGED' })
      .sort({ timestamp: -1 })
      .populate('societyId', 'name ward propertyTaxNumber')
      .populate('uploadedBy', 'name email');

    console.log(`📋 Retrieved ${pendingProofs.length} pending proofs`);

    res.json({
      success: true,
      count: pendingProofs.length,
      data: pendingProofs
    });
  } catch (error) {
    console.error('❌ Get pending proofs error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getSocietiesAdmin,
  approveProof,
  rejectProof,
  getDashboard,
  getPendingProofs
};