const express = require('express');
const router = express.Router();
const { getDashboardStats, getUsers, verifyUser, toggleUserStatus, getAuditLogs, getContactMessages } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.patch('/users/:id/verify', verifyUser);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/audit-logs', getAuditLogs);
router.get('/contact-messages', getContactMessages);

module.exports = router;
