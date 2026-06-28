import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getAdminStats, toggleAccountFreeze, getAuditLogs } from "./admin.controller";
import { validate } from "../../middleware/validate.middleware";

const adminKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const key = req.headers["x-admin-key"];
  if (!key || key !== process.env.ADMIN_SECRET_KEY) {
    res.status(403).json({
      success: false,
      message: "Invalid admin key",
    });
    return;
  }
  next();
};

const freezeSchema = z.object({
  freeze: z.boolean({
    required_error: "freeze (boolean) is required",
  }),
});

const router = Router();

router.use(adminKeyMiddleware);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: System administration — stats, account freeze, audit logs
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get system-wide statistics (admin key required)
 *     tags: [Admin]
 *     security:
 *       - AdminKey: []
 *     responses:
 *       200:
 *         description: System stats — schools, parents, students, staff, transactions
 *       403:
 *         description: Invalid admin key
 */
router.get("/stats", getAdminStats);

/**
 * @swagger
 * /admin/accounts/{id}/freeze:
 *   patch:
 *     summary: Freeze or unfreeze a parent, student, or school account
 *     tags: [Admin]
 *     security:
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [freeze]
 *             properties:
 *               freeze:
 *                 type: boolean
 *                 description: true to freeze, false to unfreeze
 *               accountType:
 *                 type: string
 *                 enum: [parent, student, school]
 *                 default: parent
 *     responses:
 *       200:
 *         description: Account freeze status updated
 *       403:
 *         description: Invalid admin key
 *       404:
 *         description: Account not found
 */
router.patch("/accounts/:id/freeze", validate(freezeSchema), toggleAccountFreeze);

/**
 * @swagger
 * /admin/logs:
 *   get:
 *     summary: Get paginated audit logs (admin key required)
 *     tags: [Admin]
 *     security:
 *       - AdminKey: []
 *     parameters:
 *       - in: query
 *         name: actorType
 *         schema:
 *           type: string
 *           enum: [parent, staff, admin, system]
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated audit log entries
 *       403:
 *         description: Invalid admin key
 */
router.get("/logs", getAuditLogs);

export default router;
