const express = require('express');
const { registerSociety, getSociety, getAllSocieties , getPublicSocieties } = require('../controllers/societyController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/public/list', getPublicSocieties);
router.post('/register', protect, authorize('BMC_ADMIN'), registerSociety);
router.get('/:societyId', protect, getSociety);
router.get('/', protect, authorize('BMC_ADMIN'), getAllSocieties);

module.exports = router;