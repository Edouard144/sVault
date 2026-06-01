import { Request, Response, NextFunction } from "express";
import {
  staffLoginService,
  createStaffService,
  getStaffListService,
} from "./staff.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedStaffRequest } from "../../types/index";

export const staffLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await staffLoginService(req.body);
    sendSuccess(res, "Login successful", result, 200);
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const staffReq = req as AuthenticatedStaffRequest;
    const result = await createStaffService(
      staffReq.staff.schoolId,
      req.body
    );
    sendSuccess(res, "Staff member created successfully", result, 201);
  } catch (error) {
    next(error);
  }
};

export const getStaffList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const staffReq = req as AuthenticatedStaffRequest;
    const result = await getStaffListService(
      staffReq.staff.schoolId,
      req.query as any
    );
    sendSuccess(res, "Staff list fetched", result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};
