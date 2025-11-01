const express = require('express');
const router = express.Router();
const adminDashboardController = require('../../controllers/admin/dashboardAdminControllers');
const { authenticateToken, requireAdmin } = require('../../middlewares/middleWare');

// Single dashboard endpoint that returns all statistics
router.get('/stats', authenticateToken, requireAdmin, adminDashboardController.getDashboardStats);

module.exports = router;