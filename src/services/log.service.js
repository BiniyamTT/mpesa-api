const { ApiLog } = require("../models/index").db;
const logger = require("../config/logger");

/**
 * @function logToDB
 * @description Inserts a structured log record into the ApiLogs table.
 * @param {string} level - Log level (INFO, ERROR, WARN).
 * @param {string} message - Human-readable message.
 * @param {object} context - Optional JSON context (e.g., endpoint, status code).
 */
const logToDB = async (level, message, context = {}) => {
  // Avoid circular dependency issues and potential crashes if the DB is down
  if (!ApiLog) {
    logger.error("Log service failed: ApiLog model not initialized.");
    return;
  }

  try {
    await ApiLog.create({
      level: level.toUpperCase(),
      message: message,
      context: context,
      timestamp: new Date(), // Explicitly set timestamp
    });
  } catch (error) {
    // We log to the file system if the database logging fails
    logger.error("CRITICAL: Failed to write log to database.", {
      dbError: error.message,
      originalMessage: message,
    });
  }
};

module.exports = { logToDB };
