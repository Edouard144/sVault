import { Router } from "express";
import {
  linkStudent,
  getMyStudents,
  getStudentById,
  searchStudents,
} from "./students.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { staffMiddleware } from "../../middleware/staff.middleware";
import { validate, validateQuery } from "../../middleware/validate.middleware";
import { linkStudentSchema, searchStudentSchema } from "./students.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student linking and profile access
 */

/**
 * @swagger
 * /students/link:
 *   post:
 *     summary: Parent links a student using token and link code
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentToken, linkCode]
 *             properties:
 *               studentToken:
 *                 type: string
 *                 example: "SV-2026-48291"
 *               linkCode:
 *                 type: string
 *                 example: "LK-7391"
 *     responses:
 *       201:
 *         description: Student linked successfully
 *       400:
 *         description: Invalid link code
 *       404:
 *         description: Student not found
 *       409:
 *         description: Already linked
 */
router.post("/link", authMiddleware, validate(linkStudentSchema), linkStudent);

/**
 * @swagger
 * /students/my-students:
 *   get:
 *     summary: Get all students linked to logged-in parent
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of linked students with balances
 */
router.get("/my-students", authMiddleware, getMyStudents);

/**
 * @swagger
 * /students/search:
 *   get:
 *     summary: Staff searches for a student by name or admission number
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term — name or admission number
 *         example: "Chris"
 *     responses:
 *       200:
 *         description: Array of matching students
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/search",
  staffMiddleware,
  validateQuery(searchStudentSchema),
  searchStudents
);

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get a single student by ID (parent must be linked)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student UUID
 *     responses:
 *       200:
 *         description: Student profile with balance and school info
 *       404:
 *         description: Student not found or not linked
 */
router.get("/:id", authMiddleware, getStudentById);

export default router;
