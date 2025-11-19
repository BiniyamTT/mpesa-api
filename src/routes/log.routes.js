// This file defines the protected API Log routes.
const express = require("express");
const logController = require("../controllers/log.controller");
const { protectAdmin } = require("../middleware/auth.admin");

const router = express.Router();

router.use(protectAdmin);

/**
 * @route GET /admin/logs
 * @description Get system API logs.
 * @access Protected (JWT)
 */
router.get("/", logController.getApiLogs);

module.exports = router;
