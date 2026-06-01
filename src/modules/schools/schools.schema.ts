import { z } from "zod";

export const createSchoolSchema = z.object({
  name: z
    .string()
    .min(2, "School name too short")
    .max(150, "School name too long"),

  prefix: z
    .string()
    .min(2, "Prefix too short")
    .max(10, "Prefix too long")
    .regex(/^[A-Z]+$/, "Prefix must be uppercase letters only")
    .transform((val) => val.toUpperCase()),

  address: z.string().max(255, "Address too long").optional(),

  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,18}$/, "Invalid phone number")
    .optional(),
});

export const getSchoolStudentsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),

  class: z.string().optional(),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type GetSchoolStudentsInput = z.infer<typeof getSchoolStudentsSchema>;
