const express = require('express');
const router = express.Router();
const { createRequest, getRequests, getRequestById, updateStatus, cancelRequest } = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

// Public route to list active requests
router.get('/', getRequests);
router.get('/:id', getRequestById);

// Protected routes
router.use(protect);
router.post('/', createRequest);
router.patch('/:id/status', updateStatus);
router.delete('/:id', cancelRequest);

module.exports = router;
