import { Request, Response, NextFunction } from "express";
import {
  sendOtpService,
  verifyOtpService,
  refreshTokenService,
  logoutService,
} from "./auth.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedParentRequest } from "../../types/index";

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await sendOtpService(req.body);
    sendSuccess(res, result.message, null, 200);
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await verifyOtpService(req.body);
    sendSuccess(res, "Login successful", result, 200);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await refreshTokenService(req.body);
    sendSuccess(res, "Token refreshed", result, 200);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await logoutService(parentReq.parent.parentId);
    sendSuccess(res, result.message, null, 200);
  } catch (error) {
    next(error);
  }
};
