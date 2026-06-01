import { Request, Response, NextFunction } from "express";
import {
  initiateWithdrawalService,
  verifyWithdrawalPinService,
  reverseWithdrawalService,
  getWithdrawalHistoryService,
} from "./withdrawals.service";
import { sendSuccess } from "../../utils/response";
import type {
  AuthenticatedStaffRequest,
  AuthenticatedParentRequest,
} from "../../types/index";

export const initiateWithdrawal = async (
  req: AuthenticatedStaffRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await initiateWithdrawalService(req.staff.staffId, req.staff.schoolId, req.body);
    sendSuccess(res, result.message, result, 201);
  } catch (error) {
    next(error);
  }
};

export const verifyWithdrawalPin = async (
  req: AuthenticatedStaffRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await verifyWithdrawalPinService(req.staff.staffId, req.body);
    sendSuccess(res, "Withdrawal approved", result, 200);
  } catch (error) {
    next(error);
  }
};

export const reverseWithdrawal = async (
  req: AuthenticatedStaffRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await reverseWithdrawalService(req.staff.staffId, req.staff.schoolId, req.params.id, req.body);
    sendSuccess(res, "Withdrawal reversed successfully", result, 200);
  } catch (error) {
    next(error);
  }
};

export const getWithdrawalHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await getWithdrawalHistoryService(parentReq.parent.parentId, req.query as any);
    sendSuccess(res, "Withdrawal history fetched", result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};
