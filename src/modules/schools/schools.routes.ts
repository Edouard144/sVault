import { Router } from "express";
import {
  createSchool,
  getSchoolStudents,
  addStudentToSchool,
} from "./schools.controller";
import { staffMiddleware, adminStaffMiddleware } from "../../middleware/staff.middleware";
import { validate, validateQuery } from "../../middleware/validate.middleware";
import {
  createSchoolSchema,
  getSchoolStudentsSchema,
} from "./schools.schema";
import { createStudentSchema } from "../students/students.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Schools
 *   description: School management and student enrollment
 */

/**
 * @swagger
 * /schools:
 *   post:
 *     summary: Create a new school (super admin only)
 *     tags: [Schools]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, prefix]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Riviera High School"
 *               prefix:
 *                 type: string
 *                 example: "RHS"
 *               address:
 *                 type: string
 *                 example: "KG 123 St, Kigali"
 *               phone:
 *                 type: string
 *                 example: "+250788000000"
 *     responses:
 *       201:
 *         description: School created successfully
 *       409:
 *         description: School prefix already exists
 */
router.post("/", validate(createSchoolSchema), createSchool);

/**
 * @swagger
 * /schools/{id}/students:
 *   get:
 *     summary: Get all students in a school (staff only)
 *     tags: [Schools]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *           default: 20
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated student list
 *       403:
 *         description: Cannot view students from another school
 */
router.get(
  "/:id/students",
  staffMiddleware,
  validateQuery(getSchoolStudentsSchema),
  getSchoolStudents
);

/**
 * @swagger
 * /schools/{id}/students:
 *   post:
 *     summary: Add a new student to a school (admin only)
 *     tags: [Schools]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, class]
 *             properties:
 *               fullName:
 *                 type: string
 *               class:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student created
 *       403:
 *         description: Cannot add students to another school
 */
router.post(
  "/:id/students",
  adminStaffMiddleware,
  validate(createStudentSchema),
  addStudentToSchool
);

export default router;
