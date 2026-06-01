import { Request, Response, NextFunction } from "express";
import {
  getParentDashboardService,
  getStudentSpendingService,
} from "./analytics.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedParentRequest } from "../../types/index";

export const getParentDashboard = async (
  req: AuthenticatedParentRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getParentDashboardService(req.parent.parentId);
    sendSuccess(res, "Dashboard fetched", result);
  } catch (error) {
    next(error);
  }
};

export const getStudentSpending = async (
  req: AuthenticatedParentRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getStudentSpendingService(
      req.parent.parentId,
      req.params.id
    );
    sendSuccess(res, "Spending analytics fetched", result);
  } catch (error) {
    next(error);
  }
};
