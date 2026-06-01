import { Request, Response, NextFunction } from "express";
import {
  getDashboardAnalyticsService,
  getStudentSpendingService,
  getStudentCategoriesService,
} from "./analytics.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedParentRequest } from "../../types/index";

export const getDashboardAnalytics = async (
  req: AuthenticatedParentRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getDashboardAnalyticsService(req.parent.parentId);
    sendSuccess(res, "Dashboard analytics fetched", result);
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
    sendSuccess(res, "Student spending analytics fetched", result);
  } catch (error) {
    next(error);
  }
};

export const getStudentCategories = async (
  req: AuthenticatedParentRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getStudentCategoriesService(
      req.parent.parentId,
      req.params.id
    );
    sendSuccess(res, "Spending categories fetched", result);
  } catch (error) {
    next(error);
  }
};
