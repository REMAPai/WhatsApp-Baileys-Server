require("dotenv").config();

const config = Object.freeze({
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl:
    process.env.DATABASE_URL || "postgresql://localhost:5432/whatsapp_baileys",
  authFolder: process.env.AUTH_FOLDER || "./auth_info",
  logLevel: process.env.LOG_LEVEL || "info",
  syncDays: parseInt(process.env.SYNC_DAYS, 10) || 30,
});

module.exports = config;
