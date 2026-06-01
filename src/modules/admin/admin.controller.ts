import { Request, Response, NextFunction } from "express";
import {
  getAdminStatsService,
  toggleAccountFreezeService,
  getAuditLogsService,
} from "./admin.service";
import { sendSuccess } from "../../utils/response";

export const getAdminStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getAdminStatsService();
    sendSuccess(res, "Platform stats fetched", result);
  } catch (error) {
    next(error);
  }
};

export const toggleAccountFreeze = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const freeze = req.body.freeze === true;
    const result = await toggleAccountFreezeService(req.params.id, freeze);
    sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string | undefined;

    const result = await getAuditLogsService(page, limit, action);
    sendSuccess(res, "Audit logs fetched", result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};
