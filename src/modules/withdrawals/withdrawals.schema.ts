import { z } from "zod";

// ─── POST /withdrawals — staff initiates a withdrawal ───
export const createWithdrawalSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .int("Amount must be a whole number")
    .min(100, "Minimum withdrawal is 100 Frw")
    .max(1_000_000, "Maximum withdrawal is 1,000,000 Frw"),

  reason: z
    .string()
    .min(1, "Reason is required")
    .max(255, "Reason too long"),
});

// ─── POST /withdrawals/:id/verify-pin — student enters PIN to approve ───
export const verifyWithdrawalPinSchema = z.object({
  pin: z
    .string()
    .length(4, "PIN must be exactly 4 digits")
    .regex(/^\d+$/, "PIN must contain only digits"),
});

// ─── POST /withdrawals/:id/reverse — staff reverses a completed withdrawal ───
export const reverseWithdrawalSchema = z.object({
  reason: z
    .string()
    .min(1, "Reversal reason is required")
    .max(255, "Reason too long"),
});

// ─── GET /withdrawals/history query params ───
export const withdrawalHistorySchema = z.object({
  studentId: z.string().uuid("Invalid student ID").optional(),
  status: z.enum(["pending", "approved", "rejected", "reversed"]).optional(),

  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type VerifyWithdrawalPinInput = z.infer<typeof verifyWithdrawalPinSchema>;
export type ReverseWithdrawalInput = z.infer<typeof reverseWithdrawalSchema>;
export type WithdrawalHistoryInput = z.infer<typeof withdrawalHistorySchema>;
