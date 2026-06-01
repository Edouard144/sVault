import { eq, desc, count } from "drizzle-orm";
import { db } from "../../config/db";
import { transactions, students, parentStudents, deposits, withdrawals } from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";
import type { AuthenticatedParentRequest } from "../../types/index";

import { desc, count } from "drizzle-orm";
import { db } from "../../config/db";
import { transactions, students, parentStudents, deposits, withdrawals } from "../../db/schema/index";

export const getStudentTransactionsService = async (studentId: string, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const txs = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      status: transactions.status,
      amount: transactions.amount,
      balanceAfter: transactions.balanceAfter,
      description: transactions.description,
      createdAt: transactions.createdAt,
      depositId: transactions.depositId,
      withdrawalId: transactions.withdrawalId,
    })
    .from(transactions)
    .where(eq(transactions.studentId, studentId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(transactions).where(eq(transactions.studentId, studentId));

  return {
    data: txs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getMyTransactionsService = async (parentId: string, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const linkedStudentIds = (
    await db.query.parentStudents.findMany({
      where: eq(parentStudents.parentId, parentId),
      columns: { studentId: true },
    })
  ).map((l) => l.studentId);

  const txs = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      status: transactions.status,
      amount: transactions.amount,
      balanceAfter: transactions.balanceAfter,
      description: transactions.description,
      createdAt: transactions.createdAt,
      studentId: transactions.studentId,
    })
    .from(transactions)
    .where(eq(transactions.studentId, linkedStudentIds[0]))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);
