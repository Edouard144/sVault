import { Router } from "express";
import { staffMiddleware, adminStaffMiddleware } from "../../middleware/staff.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate, validateQuery } from "../../middleware/validate.middleware";
import {
  createWithdrawalSchema,
  verifyWithdrawalPinSchema,
  reverseWithdrawalSchema,
  withdrawalHistorySchema,
} from "./withdrawals.schema";
import {
  createWithdrawal,
  verifyWithdrawalPin,
  reverseWithdrawal,
  getWithdrawalHistory,
} from "./withdrawals.controller";

const router = Router();

router.post("/", staffMiddleware, validate(createWithdrawalSchema), createWithdrawal);
router.post("/:id/verify-pin", validate(verifyWithdrawalPinSchema), verifyWithdrawalPin);
router.post("/:id/reverse", adminStaffMiddleware, validate(reverseWithdrawalSchema), reverseWithdrawal);
router.get("/history", staffMiddleware, validateQuery(withdrawalHistorySchema), getWithdrawalHistory);

export default router;
