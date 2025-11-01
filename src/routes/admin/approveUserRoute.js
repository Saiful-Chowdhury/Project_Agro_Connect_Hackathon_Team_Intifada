const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/middleWare');
const { isAdmin,getPendingUsers,approveUser} = require('../../controllers/admin/approveUsersControllers');


router.get('/pending', authenticateToken, getPendingUsers);
router.put('/approve/:userId', authenticateToken, approveUser);

module.exports=router;