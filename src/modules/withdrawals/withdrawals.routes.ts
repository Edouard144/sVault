import { Router } from "express";
import {
  initiateWithdrawal,
  verifyWithdrawalPin,
  reverseWithdrawal,
  getWithdrawalHistory,
} from "./withdrawals.controller";
import { staffMiddleware, adminStaffMiddleware } from "../../middleware/staff.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate, validateQuery } from "../../middleware/validate.middleware";
import {
  initiateWithdrawalSchema,
  verifyWithdrawalPinSchema,
  reverseWithdrawalSchema,
  withdrawalHistorySchema,
} from "./withdrawals.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Withdrawals
 *   description: School staff processes student withdrawals with PIN verification
 */

/**
 * @swagger
 * /withdrawals:
 *   post:
 *     summary: Initiate a withdrawal request for a student
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
 *                 format: uuid
 *               amount:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 500000
 *                 example: 5000
 *               reason:
 *                 type: string
 *                 example: "School trip fees"
 *     responses:
 *       201:
 *         description: Withdrawal initiated — student must verify with PIN
 *       403:
 *         description: Student not in your school or account frozen
 *       404:
 *         description: Student not found
 */
router.post(
  "/",
  staffMiddleware,
  validate(initiateWithdrawalSchema),
  initiateWithdrawal
);

/**
 * @swagger
 * /withdrawals/verify-pin:
 *   post:
 *     summary: Verify student PIN to approve a pending withdrawal
 *     tags: [Withdrawals]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [withdrawalId, pin]
 *             properties:
 *               withdrawalId:
 *                 type: string
 *                 format: uuid
 *               pin:
 *                 type: string
 *                 description: 4-digit student PIN
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Withdrawal approved — balance deducted
 *       400:
 *         description: Incorrect PIN or insufficient balance
 *       403:
 *         description: Unauthorized — withdrawal belongs to a different staff
 *       404:
 *         description: Withdrawal not found
 */
router.post(
  "/verify-pin",
  staffMiddleware,
  validate(verifyWithdrawalPinSchema),
  verifyWithdrawalPin
);

/**
 * @swagger
 * /withdrawals/history:
 *   get:
 *     summary: Get withdrawal history for a parent's linked students
 *     tags: [Withdrawals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Paginated withdrawal history with student and staff details
 */
router.get(
  "/history",
  authMiddleware,
  validateQuery(withdrawalHistorySchema),
  getWithdrawalHistory
);

/**
 * @swagger
 * /withdrawals/{id}/reverse:
 *   post:
 *     summary: Reverse an approved withdrawal (admin staff only)
 *     tags: [Withdrawals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 example: "Incorrect amount — refunded"
 *     responses:
 *       200:
 *         description: Withdrawal reversed — balance restored
 *       403:
 *         description: Student does not belong to your school
 *       404:
 *         description: Withdrawal not found or cannot be reversed
 */
router.post(
  "/:id/reverse",
  adminStaffMiddleware,
  validate(reverseWithdrawalSchema),
  reverseWithdrawal
);

export default router;
