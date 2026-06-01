import { Request, Response, NextFunction } from "express";
import {
  createWithdrawalService,
  verifyWithdrawalPinService,
  reverseWithdrawalService,
  getWithdrawalHistoryService,
} from "./withdrawals.service";
import { sendSuccess } from "../../utils/response";
import type {
  AuthenticatedStaffRequest,
  AuthenticatedParentRequest,
} from "../../types/index";

// ─── POST /withdrawals — staff initiates ───
export const createWithdrawal = async (
  req: AuthenticatedStaffRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await createWithdrawalService(
      req.staff.staffId,
      req.staff.schoolId,
      req.body
    );
    sendSuccess(res, "Withdrawal initiated, awaiting PIN verification", result, 201);
  } catch (error) {
    next(error);
  }
};

// ─── POST /withdrawals/:id/verify-pin — student/PIN verification ───
export const verifyWithdrawalPin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await verifyWithdrawalPinService(req.params.id, req.body);
    sendSuccess(res, "Withdrawal approved successfully", result, 200);
  } catch (error) {
    next(error);
  }
};

// ─── POST /withdrawals/:id/reverse — admin only ───
export const reverseWithdrawal = async (
  req: AuthenticatedStaffRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await reverseWithdrawalService(
      req.staff.staffId,
      req.staff.role,
      req.params.id,
      req.body
    );
    sendSuccess(res, "Withdrawal reversed successfully", result, 200);
  } catch (error) {
    next(error);
  }
};

// ─── GET /withdrawals/history — staff or parent ───
export const getWithdrawalHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const staffReq = req as AuthenticatedStaffRequest;
    const parentReq = req as AuthenticatedParentRequest;

    const result = await getWithdrawalHistoryService(
      staffReq.staff?.schoolId,
      parentReq.parent?.parentId,
      req.query as any
    );
    sendSuccess(res, "Withdrawal history fetched", result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};
