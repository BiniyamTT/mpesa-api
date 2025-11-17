// Run this with: node init-db.js
require('dotenv').config();
const { initializeDatabase } = require('./src/models/index');

const run = async () => {
  console.log("--- STARTING MANUAL DB INIT ---");
  try {
    await initializeDatabase();
    console.log("--- MANUAL DB INIT SUCCESS ---");
    process.exit(0);
  } catch (error) {
    console.error("--- MANUAL DB INIT FAILED ---");
    console.error(error);
    process.exit(1);
  }
};

run();