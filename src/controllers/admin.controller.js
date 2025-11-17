// This controller provides data for the Admin Dashboard (FR-AD3, FR-AD4)
const { Transaction } = require("../models/index").db;
const logger = require("../config/logger");
// --- NEW IMPORTS ---
const {
  tokenCache,
  forceRefreshToken,
} = require("../services/mpesa.auth.service");

/**
 * @function getTransactions
 * @description Gets a paginated list of all transactions.
 * Fulfills FR-AD3 (Transaction History).
 */
const getTransactions = async (req, res) => {
  try {
    // We can add pagination, filtering, sorting later
    // const { page = 1, limit = 20, status } = req.query;

    const transactions = await Transaction.findAll({
      order: [["createdAt", "DESC"]], // Show newest first
    });

    res.status(200).json({
      status: "success",
      data: transactions,
    });
  } catch (error) {
    logger.error("Error fetching transactions:", { error: error.message });
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

// --- NEW FUNCTION ---
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

// --- NEW FUNCTION ---
/**
 * @function manualRefreshToken
 * @description Manually triggers a refresh of the M-PESA token.
 * Fulfills FR-AD6 (Manual Overrides).
 */
const manualRefreshToken = async (req, res) => {
  try {
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
  getTokenStatus, // <--- NEW EXPORT
  manualRefreshToken, // <--- NEW EXPORT
};
