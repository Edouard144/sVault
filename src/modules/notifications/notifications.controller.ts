import { Response, NextFunction } from "express";
import { getNotificationsService, markAsReadService } from "./notifications.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedParentRequest } from "../../types/index";

export const getNotifications = async (
  req: AuthenticatedParentRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getNotificationsService(req.parent.parentId);
    sendSuccess(res, "Notifications fetched", result);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: AuthenticatedParentRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await markAsReadService(req.parent.parentId, req.params.id);
    sendSuccess(res, "Notification marked as read");
  } catch (error) {
    next(error);
  }
};
