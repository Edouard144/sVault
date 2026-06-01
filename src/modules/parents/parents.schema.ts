import { z } from "zod";

export const updateParentSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name too short")
    .max(100, "Name too long")
    .optional(),

  fcmToken: z.string().min(1, "FCM token cannot be empty").optional(),
});

export type UpdateParentInput = z.infer<typeof updateParentSchema>;
