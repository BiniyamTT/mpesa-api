// This middleware fulfills FR-SEC4: Validating the source IP of callbacks.
const logger = require("../config/logger");

// M-PESA Sandbox does not have fixed IPs.
// For production, Safaricom provides a specific list.
const ALLOWED_IPS_PROD = [
  "196.201.214.200",
  "196.201.214.206",
  // ...add other M-PESA production IPs here
];

const verifyMpesaIP = (req, res, next) => {
  // --- IN DEVELOPMENT, WE ALLOW ALL ---
  // This lets us test with Bruno and receive callbacks from ngrok.
  if (process.env.NODE_ENV === "development") {
    logger.warn("IP Whitelist is DISABLED in development mode.");
    return next();
  }

  // Get the caller's IP
  let requestIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (requestIP.substr(0, 7) === "::ffff:") {
    requestIP = requestIP.substr(7);
  }

  logger.info(`Callback received from IP: ${requestIP}`);

  if (ALLOWED_IPS_PROD.includes(requestIP)) {
    next();
  } else {
    logger.warn(`Blocked unauthorized callback attempt from IP: ${requestIP}`);
    return res
      .status(403)
      .json({ message: "Forbidden: Unauthorized IP address" });
  }
};

module.exports = verifyMpesaIP;
