// This file defines the 'Transaction' model for our database.
// This directly relates to FR-GW4 and FR-AD3.

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Transaction = sequelize.define(
  "Transaction",
  {
    // This will be our internal unique ID (e.g., UUID)
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    // Type: "STK_PUSH", "B2C", etc.
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accountReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Status: Initiated, Pending, Success, Failed
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Initiated",
    },

    // --- M-PESA Request Fields ---
    // The unique ID we generate for the STK push (MerchantRequestID)
    merchantRequestID: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    // The unique ID M-PESA returns for the request (CheckoutRequestID)
    mpesaCheckoutRequestID: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    // --- M-PESA Callback Fields ---
    // The official receipt number on success (MpesaReceiptNumber)
    mpesaTransactionID: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    // The date from the callback (TransactionDate)
    callbackTransactionDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // The phone number from the callback (PhoneNumber)
    callbackPhoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // --- Debugging / Logging Fields (FR-AD4) ---
    initialRequestPayload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    initialResponsePayload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    callbackPayload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    failureReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // 'createdAt' and 'updatedAt' are added automatically by Sequelize
  },
  {
    // Table name will be 'Transactions'
    timestamps: true,
  }
);

module.exports = Transaction;
