import { Request, Response, NextFunction } from "express";
import { getMyProfileService, updateMyProfileService } from "./parents.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedParentRequest } from "../../types/index";

export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
    try {
      const parentReq = req as AuthenticatedParentRequest;
      const result = await getMyProfileService(parentReq.parent.parentId);
    sendSuccess(res, "Profile fetched successfully", result);
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await updateMyProfileService(parentReq.parent.parentId, req.body);
    sendSuccess(res, "Profile updated successfully", result);
  } catch (error) {
    next(error);
  }
};
