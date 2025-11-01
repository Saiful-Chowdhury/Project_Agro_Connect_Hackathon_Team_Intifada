// routes/profile.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/middleWare');
const profileController = require('../../controllers/farmers/userProfileControllers');

router.get('/me', authenticateToken, profileController.getProfile);
router.put('/me', authenticateToken, profileController.updateProfile);
router.post('/change-password', authenticateToken, profileController.changePassword);

module.exports = router;