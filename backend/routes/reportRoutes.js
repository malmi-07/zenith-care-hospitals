const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getDashboardStats, getAnalyticsReport } = require('../controllers/reportController');

router.get('/dashboard', verifyToken, getDashboardStats);
router.get('/analytics', verifyToken, getAnalyticsReport);

module.exports = router;
