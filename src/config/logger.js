// This file sets up our 'winston' logger (FR-LOG1)
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize, json } = format;

// Create the 'logs' directory if it doesn't exist
const fs = require("fs");
const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// --- UPDATED CONSOLE FORMAT ---
// Now prints the 'meta' (error details) if they exist
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  let logString = `${timestamp} ${level}: ${message}`;
  // If there is extra data (like an error object), stringify and add it
  if (Object.keys(meta).length) {
    logString += ` ${JSON.stringify(meta)}`;
  }
  return logString;
});
// -------------------------------

const fileFormat = combine(timestamp(), json());

const logger = createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: format.json(),
  transports: [
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      format: fileFormat,
      maxsize: 5242880,
    }),
    new transports.File({
      filename: "logs/combined.log",
      format: fileFormat,
      maxsize: 5242880,
    }),
  ],
});

if (process.env.NODE_ENV === "development") {
  logger.add(
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        consoleFormat // Use our updated format
      ),
    })
  );
}

module.exports = logger;
