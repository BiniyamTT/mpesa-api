// This middleware verifies the JWT for protected admin routes (FR-SEC2)
const jwt = require("jsonwebtoken");
const logger = require("../config/logger");
const { User } = require("../models/index").db;

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
      // We select '-password' to be extra sure we don't send the hash
      req.user = await User.findByPk(decoded.id);

      if (!req.user) {
        return res
          .status(401)
          .json({
            status: "error",
            message: "Not authorized, user not found.",
          });
      }

      next(); // User is valid, proceed to the controller
    } catch (error) {
      logger.warn("Admin auth failed: Invalid token", { error: error.message });
      return res
        .status(401)
        .json({ status: "error", message: "Not authorized, token failed." });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ status: "error", message: "Not authorized, no token." });
  }
};

module.exports = { protectAdmin };
