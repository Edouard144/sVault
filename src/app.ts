import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./config/swagger";
import { errorMiddleware } from "./middleware/error.middleware";

// ─── Route imports ───
import authRoutes from "./modules/auth/auth.routes";
import parentsRoutes from "./modules/parents/parents.routes";
import studentsRoutes from "./modules/students/students.routes";
import staffRoutes from "./modules/staff/staff.routes";
import schoolsRoutes from "./modules/schools/schools.routes";
import depositsRoutes from "./modules/deposits/deposits.routes";
// import depositsRoutes from "./modules/deposits/deposits.routes";
// import withdrawalsRoutes from "./modules/withdrawals/withdrawals.routes";
// import transactionsRoutes from "./modules/transactions/transactions.routes";
// import analyticsRoutes from "./modules/analytics/analytics.routes";
// import notificationsRoutes from "./modules/notifications/notifications.routes";
// import staffRoutes from "./modules/staff/staff.routes";
// import schoolsRoutes from "./modules/schools/schools.routes";
// import adminRoutes from "./modules/admin/admin.routes";

const app = express();

// ─────────────────────────────────────────
// GLOBAL MIDDLEWARE
// ─────────────────────────────────────────

// ─── Security headers ───
app.use(helmet());

// ─── CORS: allow frontend origins ───
app.use(
  cors({
    origin: process.env.NODE_ENV === "production"
      ? ["https://your-frontend-domain.com"] // replace with real domain
      : "*",
    credentials: true,
  })
);

// ─── Parse JSON bodies ───
app.use(express.json());

// ─── Parse URL-encoded bodies ───
app.use(express.urlencoded({ extended: true }));

// ─── HTTP request logger (dev only) ───
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ─────────────────────────────────────────
// SWAGGER DOCS — available at /api/docs
// ─────────────────────────────────────────
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "SVault API Docs",
    customCss: ".swagger-ui .topbar { display: none }", // hide swagger top bar
  })
);

// ─────────────────────────────────────────
// HEALTH CHECK — quick ping to verify server is alive
// ─────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "SVault API",
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────
// API ROUTES — all prefixed with /api/v1
// ─────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/parents", parentsRoutes);
app.use("/api/v1/students", studentsRoutes);
app.use("/api/v1/staff", staffRoutes);
app.use("/api/v1/schools", schoolsRoutes);
app.use("/api/v1/deposits", depositsRoutes);
app.use("/api/v1/payments", depositsRoutes);
// app.use("/api/v1/deposits", depositsRoutes);
// app.use("/api/v1/withdrawals", withdrawalsRoutes);
// app.use("/api/v1/transactions", transactionsRoutes);
// app.use("/api/v1/analytics", analyticsRoutes);
// app.use("/api/v1/notifications", notificationsRoutes);
// app.use("/api/v1/staff", staffRoutes);
// app.use("/api/v1/schools", schoolsRoutes);
// app.use("/api/v1/admin", adminRoutes);

// ─────────────────────────────────────────
// 404 — catch any unknown routes
// ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ─────────────────────────────────────────
// GLOBAL ERROR HANDLER — must be last
// ─────────────────────────────────────────
app.use(errorMiddleware);

export default app;
