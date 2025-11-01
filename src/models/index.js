const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/conifg')[process.env.NODE_ENV || 'development'];

// Create Sequelize instance with proper configuration
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port || 5432,
  dialect: config.dialect,
  dialectOptions: config.dialectOptions || {},
  logging: config.logging || false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Import models
const User = require('../models/UserSchema')(sequelize, DataTypes);
const Product = require('./ProductSchema')(sequelize, DataTypes);
const Buyer = require('../models/BuyerSchema')(sequelize, DataTypes);
const Farmer = require('./FarmersSchema')(sequelize, DataTypes);
// const Notification = require('../models/NotificationSchema')(sequelize, DataTypes);
const Order = require('../models/OrdersSchema')(sequelize, DataTypes);
const OrderItem = require('../models/OrdersIteamSchema')(sequelize, DataTypes);
const Cart = require('../models/CartSchema')(sequelize, DataTypes);
const Payment = require('../models/PaymentSchema')(sequelize, DataTypes);

// Define associations
const models = {
  User,
  Product,
  Buyer,
  Farmer,
  // Notification,
  Order,
  OrderItem,
  Cart,
  Payment
};

// Call associate methods if they exist
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Export models and sequelize instance
module.exports = {
  sequelize,
  testConnection,
  User,
  Product,
  Buyer,
  Farmer,
  // Notification,
  Order,
  OrderItem,
  Cart,
  Payment
};