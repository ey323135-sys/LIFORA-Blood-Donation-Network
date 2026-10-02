const express = require('express');
const router = express.Router();
const { getInventory, updateInventory, getRequests } = require('../controllers/bloodBankController');
const { protect } = require('../middleware/authMiddleware');

router.get('/inventory', getInventory);

router.use(protect);
router.post('/inventory', updateInventory);
router.get('/requests', getRequests);

module.exports = router;
