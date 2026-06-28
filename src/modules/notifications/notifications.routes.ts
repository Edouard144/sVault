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

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Parent notifications for deposits, withdrawals, and alerts
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get paginated notifications for the logged-in parent
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated notifications with unread count
 */
router.get("/", getNotifications);

const notificationParamsSchema = z.object({
  id: z.string().uuid(),
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.patch(
  "/:id/read",
  validate(notificationParamsSchema),
  markNotificationRead
);

export default router;
