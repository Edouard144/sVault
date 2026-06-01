import { z } from "zod";

export const staffLoginSchema = z.object({
  email: z.string().email("Invalid email address"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const createStaffSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name too short")
    .max(100, "Name too long"),

  email: z.string().email("Invalid email address"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password too long"),

  role: z.enum(["staff", "admin"]).default("staff"),
});

export const getStaffListSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
});

export type StaffLoginInput = z.infer<typeof staffLoginSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type GetStaffListInput = z.infer<typeof getStaffListSchema>;
