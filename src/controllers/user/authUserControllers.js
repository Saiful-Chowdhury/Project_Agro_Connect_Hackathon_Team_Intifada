// controllers/authController.js
const { User, Donor } = require('../../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid'); // For generating unique placeholder emails

module.exports = () => {
  // Helper: Generate placeholder email if none provided
  const generatePlaceholderEmail = (phone) => {
    return `phoneuser.${Date.now()}.${Math.random().toString(36).substring(2)}@agroconnect.local`;
    // Or: `${phone.replace(/\D/g, '')}@agroconnect.local` — but ensure uniqueness!
  };

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
    const { phone, password, name, role, donor = 'No', farm_location, business_name, trade_licence, nid, application_id, dob } = req.body;

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
        message: 'Invalid phone number. Must be 11 digits starting with 013–019.'
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

      // Generate placeholder email (since DB requires it)
      const email = generatePlaceholderEmail(phone);

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create base user
      const newUser = await User.create({
        name,
        email, // placeholder
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

      // Handle donor status (if applicable — e.g., for blood donation feature)
      if (donor === 'Yes') {
        await Donor.findOrCreate({
          where: { user_id: newUser.id },
          defaults: { user_id: newUser.id, is_active: true }
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

  const phoneSignIn = async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and password are required.'
      });
    }

    try {
      const user = await User.findOne({ where: { phone } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this phone number.'
        });
      }

      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          message: 'This account uses social login. Please contact support.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password.'
        });
      }

      const { accessToken, refreshToken } = generateTokens(user);
      res.status(200).json({
        success: true,
        message: 'Login successful.',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Phone sign-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login.'
      });
    }
  };

  return {
    phoneSignUp,
    phoneSignIn
  };
};