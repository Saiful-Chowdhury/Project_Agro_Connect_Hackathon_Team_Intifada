const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/middleWare');
const { 
  addToCart, 
  getCart, 
  confirmOrder, 
  getOrderStatus,
  updatePaymentStatus 
} = require('../../controllers/buyers/orderProductControllers');

router.post('/cart', authenticateToken, addToCart);
router.get('/cart', authenticateToken, getCart);
router.post('/confirm', authenticateToken,confirmOrder);
router.get('/:id', authenticateToken,getOrderStatus);

// For payment gateway webhook (protect with secret key in production!)
router.post('/payment/update', updatePaymentStatus);

module.exports = router;