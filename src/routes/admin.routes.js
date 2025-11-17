// This file defines the protected admin routes for the dashboard
const express = require("express");
const adminController = require("../controllers/admin.controller.js");
const { protectAdmin } = require("../middleware/auth.admin.js");

const router = express.Router();

// --- ALL ROUTES BELOW THIS ARE PROTECTED ---
router.use(protectAdmin);

// @route GET /admin/transactions
// @desc Get all transactions
router.get("/transactions", adminController.getTransactions);

// @route GET /admin/transactions/:id
// @desc Get one transaction by its ID
router.get("/transactions/:id", adminController.getTransactionById);

// --- NEW ROUTES ---

// @route GET /admin/token
// @desc Get the current M-PESA token status
router.get("/token", adminController.getTokenStatus);

// @route POST /admin/token/refresh
// @desc Force a refresh of the M-PESA token
router.post("/token/refresh", adminController.manualRefreshToken);

module.exports = router;
