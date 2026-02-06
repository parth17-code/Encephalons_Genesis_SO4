const express = require('express');
const { 
  getSocietiesAdmin, 
  approveProof, 
  rejectProof, 
  getDashboard,
  getPendingProofs 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require BMC_ADMIN role
router.use(protect);
router.use(authorize('BMC_ADMIN'));

router.get('/societies', getSocietiesAdmin);
router.post('/proof/:logId/approve', approveProof);
router.post('/proof/:logId/reject', rejectProof);
router.get('/dashboard', getDashboard);
router.get('/proofs/pending', getPendingProofs);

module.exports = router;