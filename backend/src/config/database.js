const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    dialectOptions: process.env.DB_SSL === 'true'
      ? { ssl: { rejectUnauthorized: true } }
      : {},
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
    },
  }
);

async function connectDB() {
  await sequelize.authenticate();
  logger.info('MySQL connection established.');
  // Always sync in development; use force:false in production to safely create tables
  await sequelize.sync({ alter: false, force: false });
  logger.info('Database synced.');
}

module.exports = { sequelize, connectDB };
