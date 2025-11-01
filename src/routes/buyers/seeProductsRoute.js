const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/middleWare');
const { getProducts,getProductById } = require('../../controllers/buyers/seeProductControllers');

router.get('/', authenticateToken, getProducts);
router.get('/:id', authenticateToken, getProductById);

module.exports=router