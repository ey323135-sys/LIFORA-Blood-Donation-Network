const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateAvailability, getIncomingRequests, respondToRequest, getDonationHistory } = require('../controllers/donorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('donor'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.patch('/availability', updateAvailability);
router.get('/requests', getIncomingRequests);
router.post('/requests/:id/respond', respondToRequest);
router.get('/history', getDonationHistory);

module.exports = router;
