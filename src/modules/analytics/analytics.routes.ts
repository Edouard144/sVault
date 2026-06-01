import { Router } from "express";
import {
  getDashboardAnalytics,
  getStudentSpending,
  getStudentCategories,
} from "./analytics.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

export default router;
