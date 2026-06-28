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
 *   description: Parent deposits money to student account via MoMo
 */

/**
 * @swagger
 * /deposits/initiate:
 *   post:
 *     summary: Initiate a deposit to a student's account via MoMo
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
 *                 format: uuid
 *               amount:
 *                 type: integer
 *                 minimum: 500
 *                 maximum: 1000000
 *                 example: 10000
 *               payerPhone:
 *                 type: string
 *                 example: "+250788123456"
 *     responses:
 *       201:
 *         description: Deposit initiated — awaiting MoMo confirmation
 *       403:
 *         description: Student not linked or account frozen
 *       404:
 *         description: Student not found
 */
router.post(
  "/initiate",
  authMiddleware,
  validate(initiateDepositSchema),
  initiateDeposit
);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: MTN MoMo payment webhook — do not call manually
 *     tags: [Deposits]
 *     security: []
 */
router.post(
  "/webhook",
  validate(momoWebhookSchema),
  handleMomoWebhook
);

/**
 * @swagger
 * /deposits/history:
 *   get:
 *     summary: Get deposit history for the logged-in parent
 *     tags: [Deposits]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Paginated deposit history with student details
 */
router.get(
  "/history",
  authMiddleware,
  validateQuery(depositHistorySchema),
  getDepositHistory
);

export default router;
