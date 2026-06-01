import { eq, and, desc, count } from "drizzle-orm";
import { db } from "../../config/db";
import {
  transactions,
  students,
  parentStudents,
} from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";

export const getStudentTransactionsService = async (
  parentId: string,
  studentId: string,
  page: number,
  limit: number
) => {
  const link = await db.query.parentStudents.findFirst({
    where: and(
      eq(parentStudents.parentId, parentId),
      eq(parentStudents.studentId, studentId)
    ),
  });

  if (!link) {
    throw new AppError(
      "Student not found or not linked to your account",
      404
    );
  }

  const offset = (page - 1) * limit;

  const list = await db
    .select()
    .from(transactions)
    .where(eq(transactions.studentId, studentId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(transactions)
    .where(eq(transactions.studentId, studentId));

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  return {
    data: list,
    currentBalance: student?.balance || 0,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTransactionByIdService = async (
  parentId: string,
  transactionId: string
) => {
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  });

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  const link = await db.query.parentStudents.findFirst({
    where: and(
      eq(parentStudents.parentId, parentId),
      eq(parentStudents.studentId, transaction.studentId)
    ),
  });

  if (!link) {
    throw new AppError("Access denied to this transaction", 403);
  }

  const student = await db.query.students.findFirst({
    where: eq(students.id, transaction.studentId),
  });

  return {
    id: transaction.id,
    type: transaction.type,
    status: transaction.status,
    amount: transaction.amount,
    balanceAfter: transaction.balanceAfter,
    description: transaction.description,
    depositId: transaction.depositId,
    withdrawalId: transaction.withdrawalId,
    createdAt: transaction.createdAt,
    student: {
      id: student?.id,
      fullName: student?.fullName,
    },
  };
};
