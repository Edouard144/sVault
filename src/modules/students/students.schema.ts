import { z } from "zod";

export const linkStudentSchema = z.object({
  studentToken: z
    .string()
    .min(1, "Student token is required")
    .regex(/^SV-\d{4}-\d{5}$/, "Invalid student token format"),

  linkCode: z
    .string()
    .min(1, "Link code is required")
    .regex(/^LK-\d{4}$/, "Invalid link code format"),
});

export const createStudentSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name too short")
    .max(100, "Name too long"),

  class: z
    .string()
    .min(1, "Class is required")
    .max(50, "Class name too long"),
});

export const searchStudentSchema = z.object({
  q: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Query too long"),

  schoolId: z.string().uuid("Invalid school ID").optional(),
});

export type LinkStudentInput = z.infer<typeof linkStudentSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type SearchStudentInput = z.infer<typeof searchStudentSchema>;
