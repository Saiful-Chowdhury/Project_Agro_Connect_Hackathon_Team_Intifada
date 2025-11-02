const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/middleWare');
const { getNotifications,markAsRead} = require('../../controllers/buyers/notificationOrderControllers');


router.get('/', authenticateToken, getNotifications);
router.patch('/pending', authenticateToken, markAsRead);

module.exports =router