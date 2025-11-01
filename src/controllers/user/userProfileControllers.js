// controllers/profileController.js
const { User, Farmer, Buyer } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Get user profile with role-specific data
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'phone', 'role', 'created_at']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at
    };

    // Load role-specific data
    if (user.role === 'Farmer') {
      const farmerProfile = await Farmer.findOne({
        where: { user_id: userId },
        attributes: ['farm_location', 'nid', 'application_id', 'dob']
      });
      if (farmerProfile) {
        profile = { ...profile, ...farmerProfile.get() };
      }
    } else if (user.role === 'Buyer') {
      const buyerProfile = await Buyer.findOne({
        where: { user_id: userId },
        attributes: ['business_name', 'business_address', 'trade_licence']
      });
      if (buyerProfile) {
        profile = { ...profile, ...buyerProfile.get() };
      }
    }

    res.status(200).json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
};

// Update profile (user + role-specific)
const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, email, phone, farm_location, business_name, business_address } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // --- Validate and update core user fields ---
    const updates = {};

    if (name !== undefined && name.trim() !== '') {
      updates.name = name.trim();
    }

    // Email uniqueness (exclude self)
    if (email !== undefined) {
      const emailExists = await User.findOne({
        where: { email, id: { [Op.ne]: userId } }
      });
      if (emailExists) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
      updates.email = email.toLowerCase().trim();
    }

    // Phone uniqueness (exclude self)
    if (phone !== undefined) {
      const phoneExists = await User.findOne({
        where: { phone, id: { [Op.ne]: userId } }
      });
      if (phoneExists) {
        return res.status(409).json({ success: false, message: 'Phone number already in use' });
      }
      // Optional: validate BD phone format
      const phoneRegex = /^01[3-9]\d{8}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number format' });
      }
      updates.phone = phone;
    }

    if (Object.keys(updates).length > 0) {
      await User.update(updates, { where: { id: userId } });
    }

    // --- Update role-specific profile ---
    if (user.role === 'Farmer') {
      if (farm_location !== undefined) {
        await Farmer.update(
          { farm_location },
          { where: { user_id: userId } }
        );
      }
    } else if (user.role === 'Buyer') {
      const buyerUpdates = {};
      if (business_name !== undefined) buyerUpdates.business_name = business_name;
      if (business_address !== undefined) buyerUpdates.business_address = business_address;

      if (Object.keys(buyerUpdates).length > 0) {
        await Buyer.update(buyerUpdates, { where: { user_id: userId } });
      }
    }

    // Return updated profile
    const updatedUser = await User.findByPk(userId);
    let profile = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role
    };

    if (updatedUser.role === 'Farmer') {
      const farmer = await Farmer.findOne({ where: { user_id: userId } });
      if (farmer) profile = { ...profile, ...farmer.get() };
    } else if (updatedUser.role === 'Buyer') {
      const buyer = await Buyer.findOne({ where: { user_id: userId } });
      if (buyer) profile = { ...profile, ...buyer.get() };
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Change password (for phone/password users)
const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  const userId = req.user.id;

  if (!current_password || !new_password) {
    return res.status(400).json({
      success: false,
      message: 'Current and new password are required'
    });
  }

  if (new_password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters'
    });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user || !user.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'Password change not available for this account'
      });
    }

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(new_password, salt);

    await User.update(
      { password_hash: newPasswordHash },
      { where: { id: userId } }
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};


module.exports = {
  getProfile,
  updateProfile,
  changePassword
};