const express = require('express');
const router = express.Router();
const { getDashboardStats, getRequestMatches, verifyDonation } = require('../controllers/hospitalController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('hospital', 'admin'));

router.get('/dashboard', getDashboardStats);
router.get('/matches/:requestId', getRequestMatches);
router.post('/verify-donation', verifyDonation);

module.exports = router;
