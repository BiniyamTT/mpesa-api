// This controller handles the asynchronous responses from M-PESA.
const { Transaction } = require("../models/index").db;
const logger = require("../config/logger");
const { logToDB } = require("../services/log.service"); // <--- NEW IMPORT

/**
 * @function handleSTKCallback
 * @description Receives the JSON payload from M-PESA and updates the transaction.
 */
const handleSTKCallback = async (req, res) => {
  try {
    logger.info("--- Received M-PESA STK Callback ---", { payload: req.body });
    logToDB("INFO", "Received asynchronous M-PESA callback.", {
      payloadSummary: req.body.Body?.stkCallback?.ResultDesc,
    }); // <--- NEW DB LOG (RECEIVE)

    const callbackBody = req.body.Body?.stkCallback;

    if (!callbackBody) {
      logger.error("Invalid Callback Payload: Missing Body.stkCallback");
      logToDB("ERROR", "Callback rejected due to invalid payload structure.", {
        rawBody: req.body,
      }); // <--- NEW DB LOG
      return res.status(400).json({ message: "Invalid payload" });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callbackBody;

    // 2. Find the transaction in our DB
    const transaction = await Transaction.findOne({
      where: { merchantRequestID: MerchantRequestID },
    });

    if (!transaction) {
      logger.error(
        `Callback received for unknown MerchantRequestID: ${MerchantRequestID}`
      );
      logToDB("WARN", "Callback received but matching transaction not found.", {
        MerchantRequestID,
      }); // <--- NEW DB LOG
      return res
        .status(200)
        .json({ message: "Transaction not found, but callback received" });
    }

    // 3. Determine the new status
    let newStatus = ResultCode === 0 ? "Success" : "Failed";

    // 4. Parse the new metadata
    let mpesaReceiptNumber = null;
    let failureReason = ResultDesc;

    if (ResultCode === 0) {
      const metadata = {};
      if (CallbackMetadata && CallbackMetadata.Item) {
        for (const item of CallbackMetadata.Item) {
          metadata[item.Name] = item.Value;
        }
      }
      mpesaReceiptNumber = metadata.MpesaReceiptNumber;
      failureReason = null; // Clear failure reason on success
    }

    // 5. Update the transaction in the database
    await transaction.update({
      status: newStatus,
      mpesaTransactionID: mpesaReceiptNumber,
      callbackPayload: req.body,
      failureReason: failureReason,
    });

    logger.info(
      `Transaction ${transaction.id} updated to status: ${newStatus}`
    );
    logToDB(
      newStatus === "Success" ? "INFO" : "ERROR",
      `Transaction status updated: ${newStatus}`,
      {
        transactionId: transaction.id,
        resultCode: ResultCode,
        receipt: mpesaReceiptNumber,
      }
    ); // <--- NEW DB LOG (FINAL STATUS)

    // 6. Respond to M-PESA
    res.status(200).json({ message: "Callback processed successfully" });
  } catch (error) {
    logger.error("Error processing STK Callback", { error: error.message });
    logToDB("ERROR", "Internal error processing M-PESA callback.", {
      error: error.message,
    }); // <--- NEW DB LOG
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { handleSTKCallback };
