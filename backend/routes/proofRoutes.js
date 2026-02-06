const express = require('express');
const { uploadProof, getSocietyProofs, getProof } = require('../controllers/proofController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/upload', protect, authorize('SECRETARY'), upload.single('image'), uploadProof);
router.get('/society/:societyId', protect, getSocietyProofs);
router.get('/:logId', protect, getProof);

module.exports = router;