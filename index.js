// This is our main 'app.py' or 'main.py' file.

// --- 1. Imports ---
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const logger = require("./src/config/logger");
// --- Import our DB initializer ---
const { initializeDatabase } = require("./src/models");

// --- Import our route files ---
const internalRoutes = require("./src/routes/internal.routes.js");
const callbackRoutes = require("./src/routes/callback.routes.js");
const authRoutes = require("./src/routes/auth.routes.js"); // <--- NEW IMPORT
const adminRoutes = require("./src/routes/admin.routes.js"); // <--- NEW IMPORT

// --- 2. App Initialization ---
const app = express();
const PORT = process.env.PORT || 4000;

// --- 3. Middleware ---
app.use(helmet());
app.use(cors());
// We must use express.json() to parse all incoming JSON bodies
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// --- 4. Routes ---
// Base route
app.get("/", (req, res) => {
  res.send("M-PESA Gateway API is running!");
});

// --- Use our route files ---
// Public Auth Routes (Login/Register)
app.use("/auth", authRoutes); // <--- NEW ROUTE MOUNT

// Protected Admin Dashboard Routes
app.use("/admin", adminRoutes); // <--- NEW ROUTE MOUNT

// Internal API (for other services)
app.use("/internal/v1", internalRoutes);

// M-PESA Callbacks (Public)
app.use("/mpesa", callbackRoutes);

// --- 5. Error Handling ---
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).send("Something broke!");
});

// --- 6. Server Startup ---
const startServer = async () => {
  try {
    // Connect to and sync the database
    await initializeDatabase();

    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// --- Run the server ---
startServer();
