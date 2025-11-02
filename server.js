require('dotenv').config();
const express = require('express');
const http = require('http');
const { exit } = require('process');
const cors = require('cors');
const { sequelize } = require('./src/models');

// INITIALIZE FIREBASE ADMIN: This happens only once, after dotenv has loaded.
// const admin = require('./src/config/firebaseAdmin');

// Farmer Route File
const userProfileRoutes = require('./src/routes/farmers/userProfileRoutes.js');
const addProductRoute = require('./src/routes/farmers/addProductRoute');



// Buyers Route File
const seeProductsRoute = require('./src/routes/buyers/seeProductsRoute.js');
const orderProductRoute = require('./src/routes/buyers/orderProductRoute.js');
const notificationOrderRoutes = require('./src/routes/buyers/notificationOrderRoutes.js');

// We call the factory functions, passing dependencies as needed.
const authRoutes = require('./src/routes/farmers/authUserRoute.js')(/* dependencies if any */);
const tokenRoutes = require('./src/routes/common/tokenRoutes.js');

// Admin Route File
// const adminAuthRoutes = require('./src/routes/admin/authAdminRoute.js');
const adminApproveUsersRoutes = require('./src/routes/admin/approveUserRoute.js');

const app = express();
const server = http.createServer(app);

// --- Core Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// --- API Routes ---
// Increase JSON payload limit (e.g., to 10 MB)
app.use(express.json({ limit: '100mb' }));

// If you also accept URL-encoded forms (e.g., from HTML forms)
app.use(express.urlencoded({ limit: '100mb', extended: true }));


app.use('/api/auth', authRoutes);
// app.use('/api/admin/auth', adminAuthRoutes);

// Admin Routes
app.use('/api/auth/token', tokenRoutes);
app.use('/api/admin/users', adminApproveUsersRoutes);


// User Routes
app.use('/api/user/profile', userProfileRoutes);

// Farmer Routes
app.use('/api/farmer/products', addProductRoute);

// Buyer Routes
app.use('/api/buyer/products', seeProductsRoute);
app.use('/api/buyer/orders', orderProductRoute);
app.use('/api/buyer/notifications', notificationOrderRoutes);

// --- Server Startup Function ----
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connection successful.');
        server.listen(process.env.PORT || 5000, () => {
            console.log(`Server is running on http://localhost:${process.env.PORT || 5000}`);
        });
    } catch (err) {
        console.error('Failed to connect to the database or start the server.');
        console.error('Error:', err.message);
        exit(1);
    }
}

// --- Graceful Shutdown ---
const gracefulShutdown = () => {
    console.log('\nShutting down gracefully...');
    server.close(() => {
        sequelize.close(() => {
            console.log('Database pool has been closed.');
            console.log('Server is gracefully closed.');
            exit(0);
        });
    });
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// --- Initiate the server startup ---
startServer();