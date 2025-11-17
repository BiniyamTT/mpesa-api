// This file defines the routes for authentication (register, login)
const express = require("express");
const authController = require("../controllers/auth.controller.js");
const router = express.Router();

// @route POST /auth/register
// @desc Create a new admin user
router.post("/register", authController.registerAdmin);

// @route POST /auth/login
// @desc Log in and get a JWT
router.post("/login", authController.loginAdmin);

module.exports = router;
