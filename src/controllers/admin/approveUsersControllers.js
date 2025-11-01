const { User, Buyer, Farmer } = require('../../models');
const { Op, fn, col,Sequelize } = require('sequelize');


// Check Role Is Admin Middleware
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); 
    } else {
        return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
};


// Find All Users Pending Approval

const getPendingUsers = async (req, res) => {
    try {
        const pendingUsers = await User.findAll({
            where: { is_verified: false },
            attributes: ['id', 'name', 'email', 'phone', 'role', 'created_at']
        });
        res.status(200).json({ success: true, users: pendingUsers });
    } catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending users' });
    }
};

// APPROVE USER REGISTRATION
const approveUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.is_verified = true;
        await user.save();
        res.status(200).json({ success: true, message: 'User approved successfully' });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ success: false, message: 'Failed to approve user' });
    }
};

module.exports = {
    approveUser,
    getPendingUsers,
    isAdmin
};


