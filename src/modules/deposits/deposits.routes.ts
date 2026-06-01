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

router.get(
  "/history",
  authMiddleware,
  validateQuery(depositHistorySchema),
  getDepositHistory
);

export default router;
