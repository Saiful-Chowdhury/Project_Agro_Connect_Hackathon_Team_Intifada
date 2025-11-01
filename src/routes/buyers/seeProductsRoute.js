const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/middleWare');
const { getProducts, ensureFarmer } = require('../../controllers/buyers/seeProductControllers');

router.get('/', authenticateToken, getProducts);

module.exports=router