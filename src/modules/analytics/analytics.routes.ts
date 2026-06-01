import { Router } from "express";
import {
  getParentDashboard,
  getStudentSpending,
} from "./analytics.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Parent dashboard and student spending analytics
 */

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Parent dashboard — totals, balance, recent transactions
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data with totals and recent activity
 */
router.get("/dashboard", getParentDashboard);

/**
 * @swagger
 * /analytics/students/{id}/spending:
 *   get:
 *     summary: Spending breakdown for a specific student
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
 *         description: Spending by category, totals, recent withdrawals
 *       403:
 *         description: Student not linked to your account
 */
router.get("/students/:id/spending", getStudentSpending);

export default router;
