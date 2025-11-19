// This middleware verifies the JWT for protected admin routes (FR-SEC2)
const jwt = require("jsonwebtoken");
const logger = require("../config/logger");
const { User } = require("../models/index").db; // Ensure User is destructured properly


const protectAdmin = async (req, res, next) => {
  let token;

  // Check for 'Authorization: Bearer [token]'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 1. Get token from header
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Get user from the token's ID and attach to request object
      // FindByPk returns null if not found
      req.user = await User.findByPk(decoded.id);

      if (!req.user) {
        logger.warn(
          "Admin auth failed: User ID found in token does not exist in DB."
        );
        return res
          .status(401)
          .json({
            status: "error",
            message: "Not authorized, user not found.",
          });
      }

      next(); // User is valid, proceed to the controller
    } catch (error) {
      // Catch token verification errors (expired, invalid signature)
      logger.warn("Admin auth failed: Invalid or expired token.", {
        error: error.message,
      });
      return res
        .status(401)
        .json({
          status: "error",
          message: "Not authorized, token is invalid or expired.",
        });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ status: "error", message: "Not authorized, no token provided." });
  }
};

module.exports = { protectAdmin };
