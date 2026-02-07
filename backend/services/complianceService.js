const ProofLog = require('../models/ProofLog');
const ComplianceRecord = require('../models/ComplianceRecord');
const Society = require('../models/Society');
const { getWeekNumber, daysSince } = require('../utils/helpers');

/**
 * Evaluate compliance for a society
 */
const evaluateCompliance = async (societyId) => {
  console.log(`📊 Evaluating compliance for society: ${societyId}`);

  // Get society
  const society = await Society.findById(societyId);
  if (!society) {
    throw new Error('Society not found');
  }

  // Get current date info
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const week = getWeekNumber(now);

  // Get all proofs for this society
  const proofs = await ProofLog.find({ societyId }).sort({ timestamp: -1 });

  // Get last proof
  const lastProof = proofs[0];
  const lastProofDate = lastProof ? lastProof.timestamp : null;
  const daysSinceLastProof = lastProofDate ? daysSince(lastProofDate) : 999;

  // Count proof statuses
  const verifiedCount = proofs.filter(p => p.status === 'VERIFIED').length;
  const flaggedCount = proofs.filter(p => p.status === 'FLAGGED').length;
  const rejectedCount = proofs.filter(p => p.status === 'REJECTED').length;

  // Compliance rules
  let complianceStatus;
  let rebatePercent;
  let complianceScore;

  if (daysSinceLastProof === 0) {
    // Proof submitted today
    complianceStatus = 'GREEN';
    rebatePercent = 10;
    complianceScore = 100;
  } else if (daysSinceLastProof <= 2) {
    // No proof for 1-2 days
    complianceStatus = 'YELLOW';
    rebatePercent = 5;
    complianceScore = 60;
  } else {
    // No proof for 3+ days
    complianceStatus = 'RED';
    rebatePercent = 0;
    complianceScore = 20;
  }

  console.log(`📈 Compliance Status: ${complianceStatus} | Days since last proof: ${daysSinceLastProof}`);

  // Create or update compliance record
  const complianceRecord = await ComplianceRecord.findOneAndUpdate(
    { societyId, year, month, week },
    {
      complianceStatus,
      rebatePercent,
      proofCount: proofs.length,
      lastProofDate,
      daysSinceLastProof,
      verifiedProofs: verifiedCount,
      flaggedProofs: flaggedCount,
      rejectedProofs: rejectedCount,
      complianceScore
    },
    { upsert: true, new: true }
  );

  return complianceRecord;
};

/**
 * Calculate rebate for society
 */
const calculateRebate = async (societyId) => {
  const society = await Society.findById(societyId);
  if (!society) {
    throw new Error('Society not found');
  }

  // Get latest compliance record
  const latestCompliance = await ComplianceRecord.findOne({ societyId })
    .sort({ year: -1, month: -1, week: -1 });

  if (!latestCompliance) {
    return {
      societyId,
      societyName: society.name,
      complianceStatus: 'RED',
      rebatePercent: 0,
      message: 'No compliance data available',
      societyTax : 0
    };
  }

  // Map compliance to rebate
  const rebateMapping = {
    'GREEN': 10,
    'YELLOW': 5,
    'RED': 0
  };

  return {
    societyId: society._id,
    societyName: society.name,
    ward: society.ward,
    complianceStatus: latestCompliance.complianceStatus,
    rebatePercent: rebateMapping[latestCompliance.complianceStatus],
    proofCount: latestCompliance.proofCount,
    lastProofDate: latestCompliance.lastProofDate,
    daysSinceLastProof: latestCompliance.daysSinceLastProof,
    complianceScore: latestCompliance.complianceScore,
    societyTax : Math.floor(Math.random() * (12_00_000 - 8_00_000 + 1)) + 8_00_000
  };
};

/**
 * Get compliance summary for resident view
 */
const getResidentSummary = async (societyId) => {
  const society = await Society.findById(societyId).select('-__v');
  if (!society) {
    throw new Error('Society not found');
  }

  const rebateData = await calculateRebate(societyId);
  const recentProofs = await ProofLog.find({ societyId })
    .sort({ timestamp: -1 })
    .limit(10)
    .select('timestamp status imageUrl');

  // Mock waste collection data
  const mockWasteData = {
    totalWasteCollected: Math.floor(Math.random() * 500) + 200, // kg
    recyclableWaste: Math.floor(Math.random() * 150) + 50, // kg
    organicWaste: Math.floor(Math.random() * 200) + 100, // kg
    wetWaste: Math.floor(Math.random() * 150) + 50, // kg
    compostPitTemperature: Math.floor(Math.random() * 20) + 30 // °C
  };

  return {
    society,
    compliance: rebateData,
    recentProofs,
    wasteStats: mockWasteData,
  };
};

module.exports = {
  evaluateCompliance,
  calculateRebate,
  getResidentSummary
};