import { Request, Response, NextFunction } from "express";
import {
  getDashboardAnalyticsService,
  getStudentSpendingService,
  getStudentCategoriesService,
} from "./analytics.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedParentRequest } from "../../types/index";

export const getDashboardAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await getDashboardAnalyticsService(parentReq.parent.parentId);
    sendSuccess(res, "Dashboard analytics fetched", result);
  } catch (error) {
    next(error);
  }
};

export const getStudentSpending = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await getStudentSpendingService(
      parentReq.parent.parentId,
      req.params.id
    );
    sendSuccess(res, "Student spending analytics fetched", result);
  } catch (error) {
    next(error);
  }
};

export const getStudentCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await getStudentCategoriesService(
      parentReq.parent.parentId,
      req.params.id
    );
    sendSuccess(res, "Spending categories fetched", result);
  } catch (error) {
    next(error);
  }
};
