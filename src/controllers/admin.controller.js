// This controller provides data for the Admin Dashboard (FR-AD3, FR-AD4)

// --- Imports ---
const { Transaction, User, ApiLog } = require("../models/index").db; // All models
const logger = require("../config/logger");
const { Op } = require("sequelize"); // Sequelize Operators for filtering
const {
  tokenCache,
  forceRefreshToken,
} = require("../services/mpesa.auth.service"); // Token Services

/**
 * @function getTransactions
 * @description Gets a list of all transactions, supporting filtering by status, search term (phone/ref), and date range.
 * Fulfills FR-AD3 (Transaction History).
 */
const getTransactions = async (req, res) => {
  try {
    const { since, status, search, dateFrom, dateTo } = req.query;
    let whereClause = {};
    const createdAtClauses = {};

    const hasDateRange = dateFrom || dateTo; // NEW: Check if the user set a date range

    // 1. Determine Date Filter Logic
    if (hasDateRange) {
      // A. EXPLICIT DATE RANGE (User Audit)
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (!isNaN(fromDate)) {
          createdAtClauses[Op.gte] = fromDate;
        }
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        if (!isNaN(toDate)) {
          // Set time to the end of the day to include the entire 'to' date
          toDate.setHours(23, 59, 59, 999);
          createdAtClauses[Op.lte] = toDate;
        }
      }
    } else if (since) {
      // B. SMART POLLING (Only runs if no explicit range is set)
      const lastFetchTime = new Date(since);
      if (!isNaN(lastFetchTime)) {
        createdAtClauses[Op.gt] = lastFetchTime;
      }
    }

    // Apply combined date filter if any clauses exist
    if (Object.keys(createdAtClauses).length > 0) {
      whereClause.createdAt = createdAtClauses;
    }

    // 3. Status Filter (from select dropdown)
    if (status) {
      whereClause.status = status;
    }

    // 4. Search Filter (by 'search' term - targets Phone or Reference)
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause[Op.or] = [
        { phoneNumber: { [Op.like]: searchTerm } },
        { accountReference: { [Op.like]: searchTerm } },
      ];
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      status: "success",
      data: transactions,
    });
  } catch (error) {
    logger.error("Error fetching transactions:", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ status: "error", message: "Internal server error." });
  }
};

/**
 * @function getTransactionById
 * @description Gets full details for a single transaction.
 * Fulfills FR-AD4 (Transaction Detail View).
 */
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id);

    if (!transaction) {
      return res
        .status(404)
        .json({ status: "error", message: "Transaction not found." });
    }

    res.status(200).json({
      status: "success",
      data: transaction,
    });
  } catch (error) {
    logger.error("Error fetching transaction by ID:", { error: error.message });
    res
      .status(500)
      .json({ status: "error", message: "Internal server error." });
  }
};

// --- Token Management (FR-AD2, FR-AD6) ---

/**
 * @function getTokenStatus
 * @description Gets the current M-PESA token status.
 * Fulfills FR-AD2 (Token Management View).
 */
const getTokenStatus = (req, res) => {
  try {
    const now = Date.now();
    let status = "Expired";

    if (tokenCache.token && now < tokenCache.expiresAt) {
      status = "Active";
    }

    res.status(200).json({
      status: "success",
      data: {
        status,
        token: tokenCache.token
          ? `${tokenCache.token.substring(0, 10)}...`
          : null, // Show a redacted token
        expiresAt: tokenCache.expiresAt,
        humanReadable: new Date(tokenCache.expiresAt).toLocaleString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching token status:", { error: error.message });
    res
      .status(500)
      .json({ status: "error", message: "Internal server error." });
  }
};

/**
 * @function manualRefreshToken
 * @description Manually triggers a refresh of the M-PESA token.
 * Fulfills FR-AD6 (Manual Overrides).
 */
const manualRefreshToken = async (req, res) => {
  try {
    // req.user is attached by protectAdmin middleware
    logger.warn(`Manual token refresh triggered by admin: ${req.user.email}`);
    const newToken = await forceRefreshToken();

    res.status(200).json({
      status: "success",
      message: "M-PESA token has been successfully refreshed.",
      data: {
        token: `${newToken.substring(0, 10)}...`,
      },
    });
  } catch (error) {
    logger.error("Error during manual token refresh:", {
      error: error.message,
    });
    res
      .status(500)
      .json({ status: "error", message: "Failed to refresh token." });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  getTokenStatus,
  manualRefreshToken,
};
