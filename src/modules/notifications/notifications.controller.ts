import { Request, Response, NextFunction } from "express";
import {
  getNotificationsService,
  markNotificationReadService,
} from "./notifications.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedParentRequest } from "../../types/index";

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getNotificationsService(
      parentReq.parent.parentId,
      page,
      limit
    );
    sendSuccess(
      res,
      "Notifications fetched",
      result.data,
      200,
      result.meta
    );
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await markNotificationReadService(
      parentReq.parent.parentId,
      req.params.id
    );
    sendSuccess(res, "Notification marked as read", result);
  } catch (error) {
    next(error);
  }
};
