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

router.get("/stats", getAdminStats);
router.patch("/accounts/:id/freeze", validate(freezeSchema), toggleAccountFreeze);
router.get("/logs", getAuditLogs);

export default router;
