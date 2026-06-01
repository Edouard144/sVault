import { Router } from "express";
import {
  getSystemOverview,
  getSchoolOverview,
  toggleSchoolFreeze,
  toggleStudentFreeze,
} from "./admin.controller";
import { adminStaffMiddleware } from "../../middleware/staff.middleware";
import { staffMiddleware } from "../../middleware/staff.middleware";

const router = Router();

router.use(adminStaffMiddleware);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: System and school administration
 */

router.get("/overview", getSystemOverview);
router.get("/schools/:id/overview", getSchoolOverview);
router.post("/schools/:id/freeze", toggleSchoolFreeze);
router.post("/students/:id/freeze", toggleStudentFreeze);

export default router;
