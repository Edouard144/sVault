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

router.get("/:id/transactions", getStudentTransactions);
router.get("/:id", getTransactionById);

export default router;
