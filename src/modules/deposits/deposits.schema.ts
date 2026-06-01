import { z } from "zod";

export const initiateDepositSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),

  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .int("Amount must be a whole number")
    .min(500, "Minimum deposit is 500 Frw")
    .max(1000000, "Maximum deposit is 1,000,000 Frw"),

  payerPhone: z
    .string()
    .regex(/^\+?[1-9]\d{9,18}$/, "Invalid phone number"),
});

export const momoWebhookSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID required"),
  externalId: z.string().uuid("Invalid external ID"),
  status: z.enum(["SUCCESSFUL", "FAILED"]),
  amount: z.number(),
  currency: z.string(),
  payer: z.object({
    partyIdType: z.literal("MSISDN"),
    partyId: z.string(),
  }),
});

export const depositHistorySchema = z.object({
  studentId: z.string().uuid("Invalid student ID").optional(),

  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
});

export type InitiateDepositInput = z.infer<typeof initiateDepositSchema>;
export type MomoWebhookInput = z.infer<typeof momoWebhookSchema>;
export type DepositHistoryInput = z.infer<typeof depositHistorySchema>;
