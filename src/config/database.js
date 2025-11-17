// This file configures the Sequelize database connection.
const { Sequelize } = require("sequelize");
const logger = require("./logger");

// We load 'dotenv' here to ensure process.env.DATABASE_URL is available
require("dotenv").config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  logger.error("DATABASE_URL is not set in the .env file. Please add it.");
  process.exit(1); // Exit the app if the DB URL is missing
}

const sequelize = new Sequelize(dbUrl, {
  dialect: "postgres", // We're using PostgreSQL
  logging: (msg) => logger.debug(`Sequelize: ${msg}`), // Send Sequelize logs to Winston
  dialectOptions: {
    // This is a good setting for production (VPS)
    // to ensure SSL is used if your database requires it.
    // For local development, you might not need it.
    // ssl: {
    //   require: true,
    //   rejectUnauthorized: false
    // }
  },
});

module.exports = sequelize;
