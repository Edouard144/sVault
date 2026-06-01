import { Response, NextFunction } from "express";
import { verifyStaffToken } from "../utils/token";
import { AppError } from "./error.middleware";
import type { AuthenticatedStaffRequest } from "../types/index";

export const staffMiddleware = (
  req: AuthenticatedStaffRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authorization header missing or malformed", 401);
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyStaffToken(token);

    req.staff = {
      staffId: payload.staffId,
      schoolId: payload.schoolId,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const adminStaffMiddleware = (
  req: AuthenticatedStaffRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authorization header missing or malformed", 401);
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyStaffToken(token);

    if (payload.role !== "admin") {
      throw new AppError("Admin access required", 403);
    }

    req.staff = {
      staffId: payload.staffId,
      schoolId: payload.schoolId,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
