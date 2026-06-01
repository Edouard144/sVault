import { Response, NextFunction } from "express";
import { getMyProfileService, updateMyProfileService } from "./parents.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedParentRequest } from "../../types/index";

export const getMyProfile = async (
  req: AuthenticatedParentRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getMyProfileService(req.parent.parentId);
    sendSuccess(res, "Profile fetched successfully", result);
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (
  req: AuthenticatedParentRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await updateMyProfileService(req.parent.parentId, req.body);
    sendSuccess(res, "Profile updated successfully", result);
  } catch (error) {
    next(error);
  }
};
