// This file will hold all our M-PESA specific constants.
// This is much cleaner than hard-coding them in our service files.

// We load 'dotenv' here as well to ensure process.env is populated
require("dotenv").config();

const mpesaConfig = {
  // Use the M-PESA Sandbox URLs
  baseURL: "https://apisandbox.safaricom.et",
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,

  // You can get these from the M-PESA Sandbox Dashboard
  // Under 'My Apps' -> [Your App] -> 'Credentials'
  // For 'Business Short Code' and 'Passkey'
  shortCode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,

  // Callback URLs
  // Make sure to use 'https' in production
  // For testing, we'll use a tool like ngrok to get a public URL
  stkCallbackURL:
    process.env.MPESA_STK_CALLBACK_URL,
  // M-PESA API Endpoints
  // We add all endpoints here
  authEndpoint: "/v1/token/generate?grant_type=client_credentials",
  stkPushEndpoint: "/mpesa/stkpush/v3/processrequest",
};

module.exports = mpesaConfig;
