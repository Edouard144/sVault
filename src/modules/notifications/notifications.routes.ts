import { Router } from "express";
import { getNotifications, markAsRead } from "./notifications.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getNotifications);
router.patch("/:id/read", validate({ id: z.string().uuid() }).shape, markAsRead);

export default router;
