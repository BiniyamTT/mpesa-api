// This new file will define all our "Internal API" endpoints (FR-3.3)
const express = require("express");
const mpesaController = require("../controllers/mpesa.controller");
// --- NEW IMPORT ---
const { verifyInternalApiKey } = require("../middleware/auth.internal");

const router = express.Router();

// --- NEW: Apply the middleware to ALL routes in this file ---
router.use(verifyInternalApiKey);

/**
 * @route POST /internal/v1/payments/request
 * @description Endpoint for other backend services to initiate an STK Push.
 * @access Private (Internal)
 * @body {number} amount
 * @body {string} phoneNumber - "2517..." or "07..."
 * @body {string} accountReference - "INV_1001"
 * @body {string} transactionDesc - "Payment for order #1001"
 */
router.post("/payments/request", mpesaController.initiateSTKPush);

// We will add other internal endpoints here
// router.post('/payouts', mpesaController.initiateB2C);
// router.get('/transactions/:id', mpesaController.getTransactionStatus);

module.exports = router;
