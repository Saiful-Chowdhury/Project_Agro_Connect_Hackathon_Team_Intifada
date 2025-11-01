require('dotenv').config(); // Load environment variables from .env

// Function to parse DATABASE_URL
const parseDatabaseUrl = (databaseUrl) => {
  const url = new URL(databaseUrl);
  return {
    username: url.username,
    password: url.password,
    database: url.pathname.substring(1), // Remove leading '/'
    host: url.hostname,
    port: url.port,
    dialect: 'postgres'
  };
};

// Use DATABASE_URL in production (Render), individual vars in development
const getConfig = (env) => {
  if (env === 'production' && process.env.DATABASE_URL) {
    return {
      ...parseDatabaseUrl(process.env.DATABASE_URL),
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    };
  }
  
  return {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  };
};

module.exports = {
  development: getConfig('development'),
  production: getConfig('production'),
  test: getConfig('test')
};