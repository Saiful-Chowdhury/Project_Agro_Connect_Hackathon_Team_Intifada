const express = require('express');
const router = express.Router();
const adminProfileController = require('../../controllers/admin/profileAdminControllers');
const { authenticateToken, requireAdmin } = require('../../middlewares/middleWare');

// Admin profile routes
router.get('/', authenticateToken, requireAdmin, adminProfileController.getAdminProfile);
router.put('/', authenticateToken, requireAdmin, adminProfileController.updateAdminProfile);
router.put('/password/change', authenticateToken, requireAdmin, adminProfileController.changePassword);
router.get('/all-admins', authenticateToken, requireAdmin, adminProfileController.getAllAdmins);

module.exports = router;