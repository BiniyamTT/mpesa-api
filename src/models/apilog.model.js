// This model defines the ApiLog table for structured system logs (FR-LOG1)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ApiLog = sequelize.define(
  "ApiLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    level: {
      // INFO, ERROR, WARN, DEBUG
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    context: {
      // Structured JSON data like endpoint, status, etc.
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    timestamps: false, // We use our own timestamp field
    tableName: "ApiLogs",
  }
);

module.exports = ApiLog;
