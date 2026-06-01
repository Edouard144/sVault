import { Router } from "express";
import {
  createWithdrawal,
  verifyWithdrawalPin,
  reverseWithdrawal,
  getWithdrawalHistory,
} from "./withdrawals.controller";
import { staffMiddleware, adminStaffMiddleware } from "../../middleware/staff.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate, validateQuery } from "../../middleware/validate.middleware";
import {
  createWithdrawalSchema,
  verifyWithdrawalPinSchema,
  reverseWithdrawalSchema,
  withdrawalHistorySchema,
} from "./withdrawals.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Withdrawals
 *   description: Student withdrawal processing with PIN verification
 */

/**
 * @swagger
 * /withdrawals:
 *   post:
 *     summary: Initiate a withdrawal (staff only)
 *     tags: [Withdrawals]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, amount, reason]
 *             properties:
 *               studentId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 5000
 *               reason:
 *                 type: string
 *                 example: "Cantine"
 *     responses:
 *       201:
 *         description: Withdrawal initiated, pending PIN verification
 *       400:
 *         description: Insufficient balance
 *       403:
 *         description: Student frozen or not in your school
 */
router.post(
  "/",
  staffMiddleware,
  validate(createWithdrawalSchema),
  createWithdrawal
);

/**
 * @swagger
 * /withdrawals/{id}/verify-pin:
 *   post:
 *     summary: Verify student PIN to approve withdrawal
 *     tags: [Withdrawals]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin]
 *             properties:
 *               pin:
 *                 type: string
 *                 example: "5274"
 *     responses:
 *       200:
 *         description: Withdrawal approved
 *       400:
 *         description: Invalid PIN, withdrawal rejected
 *       404:
 *         description: Withdrawal not found
 */
router.post(
  "/:id/verify-pin",
  validate(verifyWithdrawalPinSchema),
  verifyWithdrawalPin
);

/**
 * @swagger
 * /withdrawals/{id}/reverse:
 *   post:
 *     summary: Reverse an approved withdrawal (admin only)
 *     tags: [Withdrawals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Duplicate transaction"
 *     responses:
 *       200:
 *         description: Withdrawal reversed, balance credited
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Approved withdrawal not found
 */
router.post(
  "/:id/reverse",
  adminStaffMiddleware,
  validate(reverseWithdrawalSchema),
  reverseWithdrawal
);

/**
 * @swagger
 * /withdrawals/history:
 *   get:
 *     summary: Get withdrawal history (staff for their school, parents for linked students)
 *     tags: [Withdrawals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, reversed]
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
 *         description: Paginated withdrawal history
 */
router.get(
  "/history",
  staffMiddleware,
  validateQuery(withdrawalHistorySchema),
  getWithdrawalHistory
);

export default router;
