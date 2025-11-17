// This service handles the logic for initiating an STK Push.
const axios = require("axios");
const crypto = require("crypto");
const logger = require("../config/logger");
const mpesaConfig = require("../config/mpesa.config");
const { getMpesaToken } = require("./mpesa.auth.service");
const { getTimestamp, generatePassword } = require("../utils/mpesa.helpers");
const { Transaction } = require("../models/index").db;

/**
 * @function initiateSTKPush
 * @description This service handles the full logic of initiating an STK Push.
 * It fulfills FR-GW2 by abstracting all M-PESA complexities.
 */
const initiateSTKPush = async ({
  amount,
  phoneNumber,
  accountReference,
  transactionDesc,
}) => {
  let transactionRecord = null;

  try {
    // 1. Get a valid M-PESA token
    const token = await getMpesaToken();

    // --- HARDCODED CREDENTIALS FOR TESTING ---
    const timestamp = "20240918055823";
    const password =
      "M2VkZGU2YWY1Y2RhMzIyOWRjMmFkMTRiMjdjOWIwOWUxZDFlZDZiNGQ0OGYyMDRiNjg0ZDZhNWM2NTQyNTk2ZA==";
    const shortCode = "1020";
    // ----------------------------------------

    // 2. Format phone number
    let formattedPhone = phoneNumber;
    if (formattedPhone.startsWith("0")) {
      formattedPhone = `251${formattedPhone.substring(1)}`;
    } else if (formattedPhone.startsWith("+251")) {
      formattedPhone = formattedPhone.substring(1);
    }

    // 3. Generate a unique MerchantRequestID
    const merchantRequestID = crypto.randomUUID(); // This is OUR unique ID

    // 4. Build the full M-PESA STK Push payload
    const payload = {
      MerchantRequestID: merchantRequestID,
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount.toString(),
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: mpesaConfig.stkCallbackURL, // <-- This will now use your ngrok URL
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
      ReferenceData: [
        {
          Key: "ThirdPartyReference",
          Value: accountReference,
        },
      ],
    };

    // 5. Save Initial Record to Database
    logger.info("Saving STK Push record to database...");
    transactionRecord = await Transaction.create({
      type: "STK_PUSH",
      amount: amount,
      phoneNumber: formattedPhone,
      accountReference: accountReference,
      status: "Initiated",
      merchantRequestID: merchantRequestID, // <-- Save our unique ID
      initialRequestPayload: payload,
    });
    logger.info(`Transaction saved with ID: ${transactionRecord.id}`);

    // 6. Make the API call to M-PESA
    logger.info("Initiating STK Push with M-PESA...");
    const response = await axios.post(
      `${mpesaConfig.baseURL}${mpesaConfig.stkPushEndpoint}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 7. Update the record with M-PESA's response
    await transactionRecord.update({
      status: "Pending", // It is pending until we get the Callback
      initialResponsePayload: response.data,
      mpesaCheckoutRequestID: response.data.CheckoutRequestID, // <-- Save M-PESA's ID
    });

    logger.info("STK Push request accepted by M-PESA.", {
      data: response.data,
    });

    return response.data;
  } catch (error) {
    const errorData = error.response
      ? error.response.data
      : { message: error.message };
    logger.error("Error initiating STK Push", { error: errorData });

    if (transactionRecord) {
      await transactionRecord.update({
        status: "Failed",
        failureReason:
          errorData.ResponseDescription ||
          errorData.CustomerMessage ||
          errorData.message ||
          "Unknown Error",
        initialResponsePayload: errorData,
      });
    }

    throw new Error("Failed to initiate STK Push.");
  }
};

module.exports = { initiateSTKPush };
