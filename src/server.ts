import * as dotenv from "dotenv";

// ─── Load .env before anything else ───
dotenv.config();

import app from "./app";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║         SVault API is running        ║
  ╠══════════════════════════════════════╣
  ║  ENV  : ${process.env.NODE_ENV?.padEnd(27)}║
  ║  PORT : ${String(PORT).padEnd(27)}║
  ║  DOCS : http://localhost:${PORT}/api/docs  ║
  ╚══════════════════════════════════════╝
  `);
});

// ─── Graceful shutdown on SIGTERM (e.g. from Docker/PM2) ───
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

// ─── Catch unhandled promise rejections ───
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  server.close(() => process.exit(1));
});