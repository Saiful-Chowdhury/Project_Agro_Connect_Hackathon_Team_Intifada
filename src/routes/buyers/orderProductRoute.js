const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/middleWare');

const { 
  addToCart, 
  getCart, 
  confirmOrder, 
  getOrderStatus,
  updatePaymentStatus,
  removeFromCart
} = require('../../controllers/buyers/orderProductControllers');

router.post('/cart', authenticateToken, addToCart);
router.get('/cart', authenticateToken, getCart);
router.post('/confirm/:id', authenticateToken,confirmOrder);
router.get('/:id', authenticateToken,getOrderStatus);
router.delete('/cart/:id', authenticateToken,removeFromCart);

// For payment gateway webhook (protect with secret key in production!)
router.post('/payment/update', updatePaymentStatus);

module.exports = router;