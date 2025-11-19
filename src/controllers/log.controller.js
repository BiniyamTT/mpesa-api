// This controller is a placeholder for fetching API Logs (FR-AD3/FR-LOG1).
const { ApiLog } = require("../models/index").db;
const logger = require("../config/logger");
const { Op } = require("sequelize");

/**
 * @function getApiLogs
 * @description Fetches system logs from the database (ApiLog table), supporting filtering and searching.
 */
const getApiLogs = async (req, res) => {
  try {
    const { level, search, limit = 100 } = req.query;
    let whereClause = {};

    // 1. Log Level Filter
    if (level) {
      whereClause.level = level.toUpperCase();
    }

    // 2. Search Filter (Message or Context)
    if (search) {
      const searchTerm = `%${search}%`;
      // Search across the message text and the string representation of the JSON context
      whereClause[Op.or] = [
        { message: { [Op.like]: searchTerm } },
        // Searching JSONB requires casting to text for LIKE operator
        Sequelize.where(Sequelize.cast(Sequelize.col("context"), "TEXT"), {
          [Op.like]: searchTerm,
        }),
      ];
    }

    // Safety check: ensure the model is loaded
    if (!ApiLog) {
      // This will now throw a JSON response due to the previous fixes.
      throw new Error(
        "ApiLog model failed to initialize. Check src/models/index.js."
      );
    }

    // Find the Sequelize instance globally to use utility functions
    const { sequelize } = require("../config/database");

    const logs = await ApiLog.findAll({
      where: whereClause,
      order: [["timestamp", "DESC"]],
      attributes: ["id", "timestamp", "level", "message", "context"],
      limit: parseInt(limit),
    });

    res.status(200).json({
      status: "success",
      data: logs,
    });
  } catch (error) {
    // --- FIX: Ensure stack is passed for file logging ---
    logger.error("Fatal Error fetching API logs:", {
      message: error.message,
      stack: error.stack, // This contains the line number information
      details: error.parent ? error.parent.message : "No parent error",
    });

    res.status(500).json({
      status: "error",
      message: `Internal server error when fetching logs.`,
      detail:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = { getApiLogs };
