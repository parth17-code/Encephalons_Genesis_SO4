const express = require('express');
const { 
  evaluate, 
  getRebate, 
  getSocietySummary, 
  getHeatmapData 
} = require('../controllers/complianceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Compliance routes
router.post('/compliance/evaluate', protect, authorize('BMC_ADMIN', 'SECRETARY'), evaluate);
router.get('/rebate/:societyId', protect, getRebate);

// Resident routes
router.get('/resident/society/:societyId/summary', protect, authorize('RESIDENT', 'SECRETARY'), getSocietySummary);

// Heatmap routes
router.get('/heatmap/ward', protect, authorize('BMC_ADMIN'), getHeatmapData);

module.exports = router;