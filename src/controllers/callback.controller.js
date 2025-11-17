// This controller handles the asynchronous responses from M-PESA.
// It fulfills FR-GW3 (Receive callbacks and update status).

const { Transaction } = require("../models/index").db;
const logger = require("../config/logger");

/**
 * @function handleSTKCallback
 * @description Receives the JSON payload from M-PESA and updates the transaction.
 */
const handleSTKCallback = async (req, res) => {
  try {
    logger.info("--- Received M-PESA STK Callback ---", { payload: req.body });

    // 1. Extract the main callback body
    const callbackBody = req.body.Body?.stkCallback;

    if (!callbackBody) {
      logger.error("Invalid Callback Payload: Missing Body.stkCallback");
      return res.status(400).json({ message: "Invalid payload" });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callbackBody;

    // 2. Find the transaction in our DB using MerchantRequestID (our unique ID)
    const transaction = await Transaction.findOne({
      where: { merchantRequestID: MerchantRequestID },
    });

    if (!transaction) {
      logger.error(
        `Callback received for unknown MerchantRequestID: ${MerchantRequestID}`
      );
      return res
        .status(200)
        .json({ message: "Transaction not found, but callback received" });
    }

    // 3. Determine the new status
    let newStatus = ResultCode === 0 ? "Success" : "Failed";

    // 4. Parse the new metadata (MpesaReceiptNumber, TransactionDate, etc.)
    const metadata = {};
    if (CallbackMetadata && CallbackMetadata.Item) {
      for (const item of CallbackMetadata.Item) {
        metadata[item.Name] = item.Value;
      }
    }

    // 5. Update the transaction in the database
    await transaction.update({
      status: newStatus,
      mpesaTransactionID: metadata.MpesaReceiptNumber,
      callbackTransactionDate: metadata.TransactionDate
        ? metadata.TransactionDate.toString()
        : null,
      callbackPhoneNumber: metadata.PhoneNumber
        ? metadata.PhoneNumber.toString()
        : null,
      callbackPayload: req.body,
      failureReason: ResultCode === 0 ? null : ResultDesc,
    });

    logger.info(
      `Transaction ${transaction.id} updated to status: ${newStatus}`
    );

    // 6. Respond to M-PESA
    res.status(200).json({ message: "Callback processed successfully" });
  } catch (error) {
    logger.error("Error processing STK Callback", { error: error.message });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { handleSTKCallback };
