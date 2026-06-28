import { Router } from "express";
import {
  getStudentTransactions,
  getTransactionById,
} from "./transactions.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Full transaction history per student
 */

/**
 * @swagger
 * /transactions/{id}/transactions:
 *   get:
 *     summary: Get paginated transaction history for a linked student
 *     tags: [Transactions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student UUID
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
 *         description: Paginated transactions with current balance
 *       404:
 *         description: Student not linked or not found
 */
router.get("/:id/transactions", getStudentTransactions);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get a single transaction by ID
 *     tags: [Transactions]
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
 *         description: Transaction details
 *       404:
 *         description: Transaction not found or not accessible
 */
router.get("/:id", getTransactionById);

export default router;
