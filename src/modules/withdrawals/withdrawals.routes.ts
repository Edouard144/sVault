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

router.post(
  "/",
  staffMiddleware,
  validate(initiateWithdrawalSchema),
  initiateWithdrawal
);

router.post(
  "/verify-pin",
  staffMiddleware,
  validate(verifyWithdrawalPinSchema),
  verifyWithdrawalPin
);

router.get(
  "/history",
  authMiddleware,
  validateQuery(withdrawalHistorySchema),
  getWithdrawalHistory
);

router.post(
  "/:id/reverse",
  adminStaffMiddleware,
  validate(reverseWithdrawalSchema),
  reverseWithdrawal
);

export default router;
