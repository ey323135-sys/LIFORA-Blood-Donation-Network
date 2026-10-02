const express = require('express');
const router = express.Router();
const { 
  pledgeOrganDonation, 
  getMyPledge, 
  withdrawPledge, 
  getAllPledges 
} = require('../controllers/organController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/pledge', protect, pledgeOrganDonation);
router.get('/my-pledge', protect, getMyPledge);
router.post('/withdraw', protect, withdrawPledge);

router.get('/all', protect, authorize('admin'), getAllPledges);

module.exports = router;
