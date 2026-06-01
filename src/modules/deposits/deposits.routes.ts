import { Router } from "express";
import {
  initiateDeposit,
  handleMomoWebhook,
  getDepositHistory,
} from "./deposits.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate, validateQuery } from "../../middleware/validate.middleware";
import {
  initiateDepositSchema,
  momoWebhookSchema,
  depositHistorySchema,
} from "./deposits.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Deposits
 *   description: Parent deposits via MoMo
 */

/**
 * @swagger
 * /deposits/initiate:
 *   post:
 *     summary: Start a MoMo deposit to a student
 *     tags: [Deposits]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, amount, payerPhone]
 *             properties:
 *               studentId:
 *                 type: string
 *                 example: "a1b2c3d4-..."
 *               amount:
 *                 type: number
 *                 example: 20000
 *               payerPhone:
 *                 type: string
 *                 example: "+250788123456"
 *     responses:
 *       201:
 *         description: Deposit initiated, awaiting MoMo confirmation
 *       403:
 *         description: Student not linked or frozen
 */
router.post(
  "/initiate",
  authMiddleware,
  validate(initiateDepositSchema),
  initiateDeposit
);

/**
 * @swagger
 * /deposits/history:
 *   get:
 *     summary: Get parent's deposit history
 *     tags: [Deposits]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated deposit history
 */
router.get(
  "/history",
  authMiddleware,
  validateQuery(depositHistorySchema),
  getDepositHistory
);

export default router;
