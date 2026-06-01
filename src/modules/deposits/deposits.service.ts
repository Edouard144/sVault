import { eq, and, desc, count } from "drizzle-orm";
import { db } from "../../config/db";
import {
  deposits,
  students,
  parents,
  parentStudents,
  transactions,
} from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";
import type {
  InitiateDepositInput,
  MomoWebhookInput,
  DepositHistoryInput,
} from "./deposits.schema";

export const initiateDepositService = async (
  parentId: string,
  input: InitiateDepositInput
) => {
  const { studentId, amount, payerPhone } = input;

  const link = await db.query.parentStudents.findFirst({
    where: and(
      eq(parentStudents.parentId, parentId),
      eq(parentStudents.studentId, studentId)
    ),
  });

  if (!link) {
    throw new AppError("Student not linked to your account", 403);
  }

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  if (student.isFrozen) {
    throw new AppError("This student account is frozen", 403);
  }

  const [newDeposit] = await db
    .insert(deposits)
    .values({
      parentId,
      studentId,
      amount,
      payerPhone,
      status: "pending",
    })
    .returning();

  return {
    depositId: newDeposit.id,
    amount: newDeposit.amount,
    status: newDeposit.status,
    payerPhone: newDeposit.payerPhone,
    message: "Deposit initiated. Awaiting MoMo confirmation.",
  };
};

export const handleMomoWebhookService = async (input: MomoWebhookInput) => {
  const { externalId, status, transactionId } = input;

  const deposit = await db.query.deposits.findFirst({
    where: and(
      eq(deposits.id, externalId),
      eq(deposits.status, "pending")
    ),
  });

  if (!deposit) {
    return { received: true };
  }

  if (status === "FAILED") {
    await db
      .update(deposits)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(deposits.id, deposit.id));

    return { received: true };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(deposits)
      .set({
        status: "completed",
        momoTransactionId: transactionId,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(deposits.id, deposit.id));

    const [updatedStudent] = await tx
      .update(students)
      .set({
        balance: deposit.amount + (
          await tx.query.students.findFirst({
            where: eq(students.id, deposit.studentId),
          })
        )!.balance,
        updatedAt: new Date(),
      })
      .where(eq(students.id, deposit.studentId))
      .returning();

    await tx.insert(transactions).values({
      studentId: deposit.studentId,
      type: "deposit",
      status: "completed",
      amount: deposit.amount,
      balanceAfter: updatedStudent.balance,
      description: `Deposit via MoMo from ${deposit.payerPhone}`,
      depositId: deposit.id,
    });
  });

  return { received: true };
};

export const getDepositHistoryService = async (
  parentId: string,
  input: DepositHistoryInput
) => {
  const { studentId, page, limit } = input;
  const offset = (page - 1) * limit;

  const whereClause = studentId
    ? and(
        eq(deposits.parentId, parentId),
        eq(deposits.studentId, studentId)
      )
    : eq(deposits.parentId, parentId);

  const history = await db
    .select({
      id: deposits.id,
      amount: deposits.amount,
      status: deposits.status,
      payerPhone: deposits.payerPhone,
      momoTransactionId: deposits.momoTransactionId,
      confirmedAt: deposits.confirmedAt,
      createdAt: deposits.createdAt,
      studentId: deposits.studentId,
    })
    .from(deposits)
    .where(whereClause)
    .orderBy(desc(deposits.createdAt))
    .limit(limit)
    .offset(offset);

  const withStudent = await Promise.all(
    history.map(async (d) => {
      const student = await db.query.students.findFirst({
        where: eq(students.id, d.studentId),
      });
      return {
        ...d,
        student: {
          id: student?.id,
          fullName: student?.fullName,
        },
      };
    })
  );

  const [{ total }] = await db
    .select({ total: count() })
    .from(deposits)
    .where(whereClause);

  return {
    data: withStudent,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
