import { Request, Response, NextFunction } from "express";
import {
  getStudentTransactionsService,
  getTransactionByIdService,
} from "./transactions.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedParentRequest } from "../../types/index";

export const getStudentTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getStudentTransactionsService(
      parentReq.parent.parentId,
      req.params.id,
      page,
      limit
    );
    sendSuccess(
      res,
      "Transactions fetched",
      result.data,
      200,
      {
        ...result.meta,
        currentBalance: result.currentBalance,
      }
    );
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await getTransactionByIdService(
      parentReq.parent.parentId,
      req.params.id
    );
    sendSuccess(res, "Transaction fetched", result);
  } catch (error) {
    next(error);
  }
};
