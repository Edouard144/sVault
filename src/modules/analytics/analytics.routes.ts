import { Router } from "express";
import {
  getDashboardAnalytics,
  getStudentSpending,
  getStudentCategories,
} from "./analytics.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Dashboard and spending insights for parents
 */

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get dashboard summary — total balance, deposits, withdrawals per student
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics with per-student breakdown
 */
router.get(
  "/dashboard",
  getDashboardAnalytics
);

/**
 * @swagger
 * /analytics/students/{id}/spending:
 *   get:
 *     summary: Get spending breakdown for a student (weekly, monthly, yearly)
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Spending summary and daily/monthly breakdowns
 *       404:
 *         description: Student not linked to your account
 */
router.get(
  "/students/:id/spending",
  getStudentSpending
);

/**
 * @swagger
 * /analytics/students/{id}/categories:
 *   get:
 *     summary: Get spending by category (reason) for a student
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of categories with totals, counts, and percentages
 *       404:
 *         description: Student not linked to your account
 */
router.get(
  "/students/:id/categories",
  getStudentCategories
);

export default router;
