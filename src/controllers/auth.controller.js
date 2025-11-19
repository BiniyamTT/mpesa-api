// This controller handles admin registration and login logic (FR-SEC2)
const jwt = require("jsonwebtoken");
const { User } = require("../models/index").db;
const logger = require("../config/logger");
const { logToDB } = require("../services/log.service");
/**
 * @function registerAdmin
 * @description Creates a new admin user.
 */
const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Email and password are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(409)
        .json({ status: "error", message: "Email already in use." });
    }

    // The 'beforeCreate' hook in user.model.js will hash the password
    const newUser = await User.create({ email, password });

    logger.info(`New admin user created: ${newUser.email}`);
    logToDB("INFO", "New admin user registered.", {
      userId: newUser.id,
      email: newUser.email,
    }); // <--- NEW DB LOG

    res.status(201).json({
      status: "success",
      message: "Admin user created successfully.",
      data: { id: newUser.id, email: newUser.email },
    });
  } catch (error) {
    logger.error("Error during admin registration:", { error: error.message });
    res
      .status(500)
      .json({ status: "error", message: "Internal server error." });
  }
};

/**
 * @function loginAdmin
 * @description Logs in an admin and returns a JWT.
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Email and password are required." });
    }

    // 1. Find the user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials." });
    }

    // 2. Compare password (using our custom model method)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logToDB("WARN", "Failed login attempt.", { email }); // <--- NEW DB LOG
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials." });
    }

    // 3. Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "8h" } // Token expires in 8 hours
    );

    logger.info(`Admin user logged in: ${user.email}`);
    logToDB("INFO", "Admin user logged in successfully.", { userId: user.id }); // <--- NEW DB LOG
    res.status(200).json({
      status: "success",
      message: "Login successful.",
      data: { token },
    });
  } catch (error) {
    logger.error("Error during admin login:", { error: error.message });
    res
      .status(500)
      .json({ status: "error", message: "Internal server error." });
  }
};

module.exports = { registerAdmin, loginAdmin };