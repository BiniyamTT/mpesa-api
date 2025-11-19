const axios = require("axios");
const logger = require("../config/logger");
const {
  baseURL,
  consumerKey,
  consumerSecret,
  authEndpoint,
} = require("../config/mpesa.config");
const { logToDB } = require("./log.service"); // <--- CRITICAL FIX: ADD MISSING IMPORT

// An in-memory cache for the token.
// In a production/multi-server setup, you would use Redis for this.
const tokenCache = {
  token: null,
  expiresAt: 0, // Expiry time in milliseconds
};

/**
 * @function getMpesaToken
 * @description Fetches a new M-PESA OAuth token or returns a cached one.
 * This function handles the M-PESA API requirement (FR-GW2, FR-AD2).
 * @returns {Promise<string>} The M-PESA access token.
 */
const getMpesaToken = async () => {
  // Check if we have a valid, non-expired token in cache
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    logger.info("Using cached M-PESA token.");
    return tokenCache.token;
  }

  // If token is invalid or expired, fetch a new one.
  logger.info("Fetching new M-PESA token...");
  logToDB("INFO", "M-PESA token requested (fetching new one)."); // <--- NEW DB LOG

  try {
    // Generate the Base64-encoded credentials
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      "base64"
    );

    // Make the request to M-PESA API
    const response = await axios.get(
      `${baseURL}${authEndpoint}`, // Use the endpoint from config
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    const token = response.data.access_token;
    const expiresIn = response.data.expires_in; // This is in seconds (e.g., 3599)

    // Calculate expiry time in milliseconds.
    // We add a 300-second (5-minute) buffer to be safe.
    const safetyBuffer = 300 * 1000;
    tokenCache.expiresAt = Date.now() + expiresIn * 1000 - safetyBuffer;
    tokenCache.token = token;

    logger.info("Successfully fetched and cached new M-PESA token.");
    logToDB("INFO", "M-PESA token successfully renewed."); // <--- NEW DB LOG
    return token;
  } catch (error) {
    // Log the full error
    if (error.response) {
      logger.error(
        `Error fetching M-PESA token: ${error.response.status} ${error.response.statusText}`,
        {
          data: error.response.data,
        }
      );
    } else if (error.request) {
      logger.error("Error fetching M-PESA token: No response from server", {
        request: error.request,
      });
    } else {
      logger.error("Error fetching M-PESA token: Request setup error", {
        message: error.message,
      });
    }

    // Don't cache a failure
    tokenCache.token = null;
    tokenCache.expiresAt = 0;

    // Re-throw the error so the calling function knows something went wrong
    logToDB("ERROR", "Failed to retrieve M-PESA OAuth token.", {
      status: error.response?.status,
      message: error.message,
    }); // <--- NEW DB LOG
    throw new Error("Could not authenticate with M-PESA.");
  }
};

/**
 * @function forceRefreshToken
 * @description Manually clears the cache and fetches a new token.
 * Fulfills FR-AD6.
 */
const forceRefreshToken = async () => {
  logToDB("INFO", "Manual token cache invalidation requested.", {
    type: "admin_action",
  });
  tokenCache.token = null;
  tokenCache.expiresAt = 0;
  return await getMpesaToken();
};

// We export the function to be used in other files
module.exports = {
  getMpesaToken,
  forceRefreshToken, // <--- NEW EXPORT
  tokenCache, // <--- NEW EXPORT
};
