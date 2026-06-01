import { Request } from "express";

export interface AuthenticatedParentRequest extends Request {
  parent: {
    parentId: string;
    phone: string;
  };
}

export interface AuthenticatedStaffRequest extends Request {
  staff: {
    staffId: string;
    schoolId: string;
    role: "staff" | "admin";
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type TransactionType = "deposit" | "withdrawal";
export type TransactionStatus = "pending" | "completed" | "failed" | "reversed";

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "reversed";

export type DepositStatus = "pending" | "completed" | "failed";

export type NotificationType =
  | "deposit_success"
  | "withdrawal_success"
  | "withdrawal_reversed"
  | "low_balance"
  | "account_frozen";

export type StaffRole = "staff" | "admin";

export interface MoMoWebhookPayload {
  transactionId: string;
  externalId: string;
  status: "SUCCESSFUL" | "FAILED";
  amount: number;
  currency: string;
  payer: {
    partyIdType: "MSISDN";
    partyId: string;
  };
}
