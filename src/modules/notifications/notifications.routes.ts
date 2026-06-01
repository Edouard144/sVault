import { Router } from "express";
import { z } from "zod";
import {
  getNotifications,
  markNotificationRead,
} from "./notifications.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getNotifications);
const notificationParamsSchema = z.object({
  id: z.string().uuid(),
});

router.patch(
  "/:id/read",
  validate(notificationParamsSchema),
  markNotificationRead
);

export default router;
