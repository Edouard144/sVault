import { Router } from "express";
import { staffLogin, createStaff, getStaffList } from "./staff.controller";
import { staffMiddleware, adminStaffMiddleware } from "../../middleware/staff.middleware";
import { validate, validateQuery } from "../../middleware/validate.middleware";
import {
  staffLoginSchema,
  createStaffSchema,
  getStaffListSchema,
} from "./staff.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: School staff authentication and management
 */

/**
 * @swagger
 * /staff/login:
 *   post:
 *     summary: Staff login with email and password
 *     tags: [Staff]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john.doe@rivierahigh.rw"
 *               password:
 *                 type: string
 *                 example: "secret123"
 *     responses:
 *       200:
 *         description: Login successful — returns staff JWT token
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Account deactivated or school frozen
 */
router.post("/login", validate(staffLoginSchema), staffLogin);

/**
 * @swagger
 * /staff:
 *   post:
 *     summary: Create a new staff member (admin only)
 *     tags: [Staff]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john.doe@rivierahigh.rw"
 *               password:
 *                 type: string
 *                 example: "secret123"
 *               role:
 *                 type: string
 *                 enum: [staff, admin]
 *                 default: staff
 *     responses:
 *       201:
 *         description: Staff member created
 *       409:
 *         description: Email already exists
 *       403:
 *         description: Admin access required
 */
router.post(
  "/",
  adminStaffMiddleware,
  validate(createStaffSchema),
  createStaff
);

/**
 * @swagger
 * /staff:
 *   get:
 *     summary: Get all staff members in the school (admin only)
 *     tags: [Staff]
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
 *         description: Paginated list of staff members
 *       403:
 *         description: Admin access required
 */
router.get(
  "/",
  adminStaffMiddleware,
  validateQuery(getStaffListSchema),
  getStaffList
);

export default router;
