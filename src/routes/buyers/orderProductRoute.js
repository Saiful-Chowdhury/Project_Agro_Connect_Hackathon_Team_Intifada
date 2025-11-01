const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/middleWare');
const { } = require('../../controllers/farmers/addProductControllers');

router.get('/', authenticateToken,getProducts);