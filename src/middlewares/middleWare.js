// middlewares/authenticateToken.js
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Only User model needed

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Access token is required.'
        });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({
                    success: false,
                    message: 'Access token expired.'
                });
            }
            return res.status(403).json({
                success: false,
                message: 'Invalid access token.'
            });
        }

        try {
            // Fetch user by UUID (your id is UUID)
            const user = await User.findByPk(decoded.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User account not found.'
                });
            }

            // Attach user and decoded payload to request
            req.user = user;
            req.decoded = decoded;

            next();
        } catch (dbError) {
            console.error('Database error in auth middleware:', dbError);
            return res.status(500).json({
                success: false,
                message: 'Database error during authentication.'
            });
        }
    });
};

/**
 * Middleware to require Admin role
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required.'
        });
    }
    next();
};

/**
 * Optional: Require Farmer
 */
const requireFarmer = (req, res, next) => {
    if (!req.user || req.user.role !== 'Farmer') {
        return res.status(403).json({
            success: false,
            message: 'Farmer access required.'
        });
    }
    next();
};

/**
 * Optional: Require Buyer
 */
const requireBuyer = (req, res, next) => {
    if (!req.user || req.user.role !== 'Buyer') {
        return res.status(403).json({
            success: false,
            message: 'Buyer access required.'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireFarmer,
    requireBuyer
};