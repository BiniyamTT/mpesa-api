// This new controller file will handle the request and response logic
// for our M-PESA endpoints. It's the "glue" between the route and the service.

const stkService = require("../services/mpesa.stk.service");
const logger = require("../config/logger");

/**
 * @function initiateSTKPush
 * @description Controller for initiating an STK push.
 * It validates the simplified request and calls the STK service.
 * This fulfills FR-API2 and FR-API5 (Standardized Responses).
 */
const initiateSTKPush = async (req, res) => {
  try {
    // 1. Get the simplified payload from the request body
    const { amount, phoneNumber, accountReference, transactionDesc } = req.body;

    // 2. Basic validation
    if (!amount || !phoneNumber || !accountReference || !transactionDesc) {
      return res.status(400).json({
        status: "error",
        message:
          "Missing required fields: amount, phoneNumber, accountReference, transactionDesc",
      });
    }

    // 3. Call the service to do the heavy lifting
    const mpesaResponse = await stkService.initiateSTKPush({
      amount,
      phoneNumber,
      accountReference,
      transactionDesc,
    });

    // 4. Send a standardized success response (FR-API5)
    res.status(200).json({
      status: "success",
      message: "STK Push initiated successfully. Waiting for callback.",
      data: mpesaResponse, // This is the response from M-PESA
    });
  } catch (error) {
    logger.error("STK Push controller error:", { message: error.message });
    // 5. Send a standardized error response (FR-API5)
    res.status(500).json({
      status: "error",
      message: "An internal server error occurred.",
      error: error.message,
    });
  }
};

// We will add other controllers here (B2C, C2B, etc.)
module.exports = {
  initiateSTKPush,
};
