// This file defines the routes for receiving callbacks from M-PESA.
const express = require("express");
const callbackController = require("../controllers/callback.controller");
const verifyMpesaIP = require("../middleware/ip.whitelist");

const router = express.Router();

/**
 * @route POST /mpesa/callback/stk
 * @description Public endpoint for M-PESA to send STK Push results.
 * @access Public (but restricted by IP whitelist in production)
 */
router.post(
  "/callback/stk",
  verifyMpesaIP,
  callbackController.handleSTKCallback
);

module.exports = router;
