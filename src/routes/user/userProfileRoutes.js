// routes/profile.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const profileController = require('../controllers/profileController');

router.get('/me', authenticateToken, profileController.getProfile);
router.put('/me', authenticateToken, profileController.updateProfile);
router.post('/change-password', authenticateToken, profileController.changePassword);

module.exports = router;