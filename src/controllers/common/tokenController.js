// controllers/authController.js (or wherever you keep it)
const jwt = require('jsonwebtoken');
const { User } = require('../../models'); // Only User model

const refreshAccessToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ message: 'Refresh token is required.' });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        // Find user by UUID (refresh token payload must contain 'id')
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(403).json({
                message: 'Invalid refresh token: user not found.'
            });
        }

        // Build new access token payload
        const accessTokenPayload = {
            id: user.id,
            email: user.email,
            phone:user.phone,
            role: user.role, // 'Farmer', 'Buyer', 'Admin'
            is_verified: user.is_verified
        };

        const newAccessToken = jwt.sign(
            accessTokenPayload,
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '15m' }
        );

        res.status(200).json({ accessToken: newAccessToken });

    } catch (error) {
        console.error('Refresh token error:', error.message);
        return res.status(403).json({
            message: 'Invalid or expired refresh token.'
        });
    }
};

module.exports = {
    refreshAccessToken
};