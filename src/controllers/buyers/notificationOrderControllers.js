const { User, Buyer, Farmer, Notification } = require('../../models');
const { Op, fn, col, Sequelize } = require('sequelize');

// GET /api/notifications
const getNotifications = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['id', 'title', 'message', 'is_read', 'type', 'created_at', 'related_order_id']
    });

    res.json({
      success: true,
      notifications,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const result = await Notification.update(
      { is_read: true },
      { 
        where: { 
          id: req.params.id, 
          user_id: req.user.id 
        } 
      }
    );

    if (result[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

module.exports = {
  getNotifications,
  markAsRead
};