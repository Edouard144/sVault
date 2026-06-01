import { z } from "zod";

export const initiateWithdrawalSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .int("Amount must be a whole number")
    .min(100, "Minimum withdrawal is 100 Frw")
    .max(500_000, "Maximum withdrawal is 500,000 Frw"),
  reason: z
    .string()
    .min(2, "Reason too short")
    .max(255, "Reason too long"),
});

export const verifyWithdrawalPinSchema = z.object({
  withdrawalId: z.string().uuid("Invalid withdrawal ID"),
  pin: z
    .string()
    .length(4, "PIN must be exactly 4 digits")
    .regex(/^\d+$/, "PIN must contain only digits"),
});

export const reverseWithdrawalSchema = z.object({
  reason: z
    .string()
    .min(5, "Please provide a clear reason for the reversal")
    .max(255, "Reason too long"),
});

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

export type InitiateWithdrawalInput = z.infer<typeof initiateWithdrawalSchema>;
export type VerifyWithdrawalPinInput = z.infer<typeof verifyWithdrawalPinSchema>;
export type ReverseWithdrawalInput = z.infer<typeof reverseWithdrawalSchema>;
export type WithdrawalHistoryInput = z.infer<typeof withdrawalHistorySchema>;
