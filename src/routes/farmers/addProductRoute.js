// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/middleWare');
const { getProducts,createProduct, updateProduct, deleteProduct, ensureFarmer,getProductById } = require('../../controllers/farmers/addProductControllers');

router.get('/', authenticateToken,getProducts);
router.post('/', authenticateToken, ensureFarmer, createProduct);
router.put('/:id', authenticateToken, ensureFarmer, updateProduct);
router.delete('/:id', authenticateToken, ensureFarmer, deleteProduct);
router.get('/:id', authenticateToken, ensureFarmer, getProductById);

module.exports = router;