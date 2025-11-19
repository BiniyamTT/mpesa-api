// This file imports all models and initializes the database connection.
const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");
const logger = require("../config/logger");

// Import models
const Transaction = require("./transaction.model");
const User = require("./user.model");
const ApiLog = require("./apilog.model"); // <--- MUST BE PRESENT

const db = {
  sequelize,
  Sequelize,
  Transaction,
  User,
  ApiLog, // <--- API LOG MUST BE EXPOSED HERE
};

/**
 * @function initializeDatabase
 * @description Connects to the database and syncs models.
 */
const initializeDatabase = async () => {
  try {
    // Test the connection
    await sequelize.authenticate();
    logger.info("Database connection established successfully.");

    // 'alter: true' will check for changes and add the new 'Users' table.
    await sequelize.sync({ alter: true });
    logger.info("All models were synchronized successfully.");
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

module.exports = { db, initializeDatabase };
