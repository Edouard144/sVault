import { Router } from "express";
import {
  getDashboardAnalytics,
  getStudentSpending,
  getStudentCategories,
} from "./analytics.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get(
  "/dashboard",
  getDashboardAnalytics
);

router.get(
  "/students/:id/spending",
  getStudentSpending
);

router.get(
  "/students/:id/categories",
  getStudentCategories
);

export default router;
