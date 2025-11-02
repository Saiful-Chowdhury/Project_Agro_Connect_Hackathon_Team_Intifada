const { User, Buyer, Farmer } = require('../../models');
const { Op, fn, col,Sequelize } = require('sequelize');


// Check Role Is Admin Middleware
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next(); 
    } else {
        return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
};


// Get All Usersif Buyer then include Buyer details and if Farmer then include Farmer details
// const allUsers = async (req, res) => {
//     try {
//         const users = await User.findAll({
//             attributes: ['id', 'name', 'email', 'phone', 'role', 'is_verified', 'created_at'],
//             include: [
//                 {
//                     model: Buyer,
//                     attributes: ['business_name', 'business_address', 'trade_licence'],
//                     required: false
//                 },
//                 {
//                     model: Farmer,
//                     attributes: ['nid', 'application_id', 'farm_location', 'dob'],
//                     required: false
//                 }
//             ]
//         });
//         res.status(200).json({ success: true, users });
//     } catch (error) {
//         console.error('Get all users error:', error);
//         res.status(500).json({ success: false, message: 'Failed to fetch users' });
//     }
// };


const allUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'role', 'is_verified', 'created_at'],
      include: [
        {
          model: Buyer,
          as: 'buyerProfile', // ✅ matches User.hasOne(..., as: 'buyerProfile')
          attributes: ['business_name', 'business_address', 'trade_licence'],
          required: false
        },
        {
          model: Farmer,
          as: 'farmerProfile', // ✅ matches User.hasOne(..., as: 'farmerProfile')
          attributes: ['nid', 'application_id', 'farm_location', 'dob'],
          required: false
        }
      ]
    });
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.findAll({
      where: { is_verified: false },
      attributes: ['id', 'name', 'email', 'phone', 'role', 'created_at'],
      include: [
        {
          model: Buyer,
          as: 'buyerProfile',
          attributes: ['business_name', 'business_address', 'trade_licence'],
          required: false
        },
        {
          model: Farmer,
          as: 'farmerProfile',
          attributes: ['nid', 'application_id', 'farm_location', 'dob'],
          required: false
        }
      ]
    });
    res.status(200).json({ success: true, pendingUsers });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending users' });
  }
};
// Find All Users Pending Approval if Buyer then include Buyer details and if Farmer then include Farmer details
// const getPendingUsers = async (req, res) => {
//     try {
//         const pendingUsers = await User.findAll({
//             where: { is_verified: false },
//             attributes: ['id', 'name', 'email', 'phone', 'role', 'created_at'],
//             include: [
//                 {
//                     model: Buyer,   
//                     attributes: ['business_name', 'business_address', 'trade_licence'],
//                     required: false
//                 },
//                 {
//                     model: Farmer,
//                     attributes: ['nid', 'application_id', 'farm_location', 'dob'],
//                     required: false
//                 }
//             ]
//         });
//         res.status(200).json({ success: true, pendingUsers });
//     }
//     catch (error) {
//         console.error('Get pending users error:', error);
//         res.status(500).json({ success: false, message: 'Failed to fetch pending users' });
//     }
// };
    
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
    isAdmin,
    allUsers
};


