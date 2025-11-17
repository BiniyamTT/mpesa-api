// This middleware verifies the API Key for the Internal API (FR-API1)
const logger = require("../config/logger");

// Load the secret key from the environment
const { INTERNAL_API_KEY } = process.env;

if (!INTERNAL_API_KEY) {
  logger.error("CRITICAL: INTERNAL_API_KEY is not set in .env file.");
  // We don't exit the process here, but we will block all internal requests.
}

const verifyInternalApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized, no API key provided.",
      });
    }

    if (apiKey !== INTERNAL_API_KEY) {
      return res
        .status(403)
        .json({ status: "error", message: "Forbidden, invalid API key." });
    }

    // Key is valid, proceed to the controller
    next();
  } catch (error) {
    logger.error("Error in internal API key verification:", {
      error: error.message,
    });
    res
      .status(500)
      .json({ status: "error", message: "Internal server error." });
  }
};

module.exports = { verifyInternalApiKey };