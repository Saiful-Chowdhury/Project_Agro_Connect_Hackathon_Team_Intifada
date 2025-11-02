const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/middleWare');
const { isAdmin,getPendingUsers,approveUser,allUsers} = require('../../controllers/admin/approveUsersControllers');


router.get('/pending', authenticateToken, isAdmin,getPendingUsers);
router.put('/approve/:userId', authenticateToken,isAdmin, approveUser);
router.put('/all', authenticateToken,isAdmin, allUsers);

module.exports=router;