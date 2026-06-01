import { Request, Response, NextFunction } from "express";
import {
  initiateDepositService,
  handleMomoWebhookService,
  getDepositHistoryService,
} from "./deposits.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedParentRequest } from "../../types/index";

export const initiateDeposit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await initiateDepositService(
      parentReq.parent.parentId,
      req.body
    );
    sendSuccess(res, result.message, result, 201);
  } catch (error) {
    next(error);
  }
};

export const handleMomoWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await handleMomoWebhookService(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(200).json({ received: true });
  }
};

export const getDepositHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await getDepositHistoryService(
      parentReq.parent.parentId,
      req.query as any
    );
    sendSuccess(res, "Deposit history fetched", result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};
