const express = require('express');
const router = express.Router();
const { refreshAccessToken } = require('../../controllers/common/tokenController');

// This route can be used by both regular users and admins
router.post('/refresh-token', refreshAccessToken);

module.exports = router;