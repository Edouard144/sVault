import { Request, Response, NextFunction } from "express";
import {
  getSystemOverviewService,
  getSchoolOverviewService,
  toggleSchoolFreezeService,
  toggleStudentFreezeService,
} from "./admin.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedStaffRequest } from "../../types/index";

export const getSystemOverview = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getSystemOverviewService();
    sendSuccess(res, "System overview fetched", result);
  } catch (error) {
    next(error);
  }
};

export const getSchoolOverview = async (
  req: AuthenticatedStaffRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getSchoolOverviewService(req.staff.schoolId);
    sendSuccess(res, "School overview fetched", result);
  } catch (error) {
    next(error);
  }
};

export const toggleSchoolFreeze = async (
  req: AuthenticatedStaffRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await toggleSchoolFreezeService(
      req.params.id,
      req.staff.staffId,
      req.staff.role
    );
    sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const toggleStudentFreeze = async (
  req: AuthenticatedStaffRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await toggleStudentFreezeService(
      req.params.id,
      req.staff.schoolId
    );
    sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};
