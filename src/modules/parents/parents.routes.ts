import { Router } from "express";
import { getMyProfile, updateMyProfile } from "./parents.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { updateParentSchema } from "./parents.schema";

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Parents
 *   description: Parent profile management
 */

/**
 * @swagger
 * /parents/me:
 *   get:
 *     summary: Get logged-in parent profile with linked students
 *     tags: [Parents]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Parent profile with students array
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Parent not found
 */
router.get("/me", getMyProfile);

/**
 * @swagger
 * /parents/me:
 *   patch:
 *     summary: Update logged-in parent profile
 *     tags: [Parents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "MUHIRE Jean Claude"
 *               fcmToken:
 *                 type: string
 *                 description: Firebase Cloud Messaging token
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.patch("/me", validate(updateParentSchema), updateMyProfile);

export default router;
