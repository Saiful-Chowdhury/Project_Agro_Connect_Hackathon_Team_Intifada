// controllers/authController.js
const { User} = require('../../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid'); // For generating unique placeholder emails

module.exports = () => {

  const generateTokens = (user) => {
    const accessTokenPayload = {
      id: user.id,
      phone: user.phone, // Use 'phone' to match your DB column
      role: user.role
    };
    const refreshTokenPayload = { id: user.id };
    const accessToken = jwt.sign(accessTokenPayload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '15m'
    });
    const refreshToken = jwt.sign(refreshTokenPayload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d'
    });
    return { accessToken, refreshToken };
  };

  const phoneSignUp = async (req, res) => {
    const { phone, password, email,name, role,farm_location, business_name, trade_licence, nid, application_id, dob } = req.body;

    // Validate required fields
    if (!phone || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Phone, password, name, and role are required.'
      });
    }

    // Validate role
    if (!['Farmer', 'Buyer', 'Admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be Farmer, Buyer, or Admin.'
      });
    }

    // Validate phone format (Bangladeshi)
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Must be 11 digits starting with 01.'
      });
    }

    // Password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    try {
      // Check if phone already exists
      const existingUser = await User.findOne({ where: { phone } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'A user with this phone number already exists.'
        });
      }

      // Check regex email format if provided
      if (email && email !== '') {
        //  email = email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format.'
          });
        }
      }
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create base user
      const newUser = await User.create({
        name,
        email: email ? email.toLowerCase().trim() : null, 
        phone,
        password_hash,
        role,
        is_verified: true // Phone users are auto-verified
      });

      // Create role-specific profile if needed
      if (role === 'Farmer') {
        if (!nid || !application_id) {
          await User.destroy({ where: { id: newUser.id } }); // Rollback
          return res.status(400).json({
            success: false,
            message: 'Farmer registration requires NID and application ID.'
          });
        }
        await newUser.createFarmerProfile({
          nid,
          application_id,
          farm_location,
          dob
        });
      } else if (role === 'Buyer') {
        if (!trade_licence) {
          await User.destroy({ where: { id: newUser.id } });
          return res.status(400).json({
            success: false,
            message: 'Buyer registration requires trade licence.'
          });
        }
        await newUser.createBuyerProfile({
          business_name,
          business_address: req.body.business_address,
          trade_licence
        });
      }


      const { accessToken, refreshToken } = generateTokens(newUser);
      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        accessToken,
        refreshToken
      });

    } catch (error) {
      console.error('Phone sign-up error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration.'
      });
    }
  };

  return {
    phoneSignUp,
  };
};