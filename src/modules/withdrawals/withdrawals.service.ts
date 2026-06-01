import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../../config/db";
import {
  withdrawals,
  students,
  staff,
  transactions,
  auditLogs,
  parentStudents,
  parents,
} from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";
import { verifyOtp } from "../../utils/otp";
import { notifyParentsOfStudent } from "../notifications/notifications.service";
import type {
  InitiateWithdrawalInput,
  VerifyWithdrawalInput,
  ReverseWithdrawalInput,
  WithdrawalHistoryInput,
} from "./withdrawals.schema";
import type { StaffRole } from "../../types/index";

export const initiateWithdrawalService = async (
  staffId: string,
  schoolId: string,
  input: InitiateWithdrawalInput
) => {
  const { studentId, amount, reason } = input;

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student || student.schoolId !== schoolId) {
    throw new AppError("Student not found in your school", 404);
  }

  if (student.isFrozen) {
    throw new AppError("This student account is frozen", 403);
  }

  if (student.balance < amount) {
    await db.insert(auditLogs).values({
      actorType: "staff",
      actorId: staffId,
      action: "WITHDRAWAL_INSUFFICIENT_BALANCE",
      targetType: "student",
      targetId: studentId,
      metadata: { attemptedAmount: amount, currentBalance: student.balance, reason },
    });
    throw new AppError(
      `Insufficient balance. Current: ${student.balance} Frw`,
      400
    );
  }

  const [newWithdrawal] = await db
    .insert(withdrawals)
    .values({
      studentId,
      staffId,
      amount,
      reason,
      status: "pending",
    })
    .returning();

  const staffMember = await db.query.staff.findFirst({
    where: eq(staff.id, staffId),
  });

  return {
    withdrawalId: newWithdrawal.id,
    amount: newWithdrawal.amount,
    reason: newWithdrawal.reason,
    status: newWithdrawal.status,
    student: { id: student.id, fullName: student.fullName, currentBalance: student.balance },
    staff: { id: staffMember?.id, fullName: staffMember?.fullName },
    message: "Withdrawal initiated. Student must verify with PIN.",
  };
};

export const verifyWithdrawalPinService = async (
  staffId: string,
  input: VerifyWithdrawalInput
) => {
  const { withdrawalId, pin } = input;

  const withdrawal = await db.query.withdrawals.findFirst({
    where: and(eq(withdrawals.id, withdrawalId), eq(withdrawals.status, "pending")),
  });

  if (!withdrawal) {
    throw new AppError("Withdrawal not found or already processed", 404);
  }

  if (withdrawal.staffId !== staffId) {
    throw new AppError("Unauthorized — this withdrawal belongs to a different staff session", 403);
  }

  const student = await db.query.students.findFirst({
    where: eq(students.id, withdrawal.studentId),
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  const isPinValid = await verifyOtp(pin, student.pinHash);
  if (!isPinValid) {
    await db.insert(auditLogs).values({
      actorType: "staff",
      actorId: staffId,
      action: "WITHDRAWAL_WRONG_PIN",
      targetType: "student",
      targetId: student.id,
      metadata: { withdrawalId },
    });
    throw new AppError("Incorrect PIN", 400);
  }

  if (student.balance < withdrawal.amount) {
    await db.update(withdrawals).set({ status: "rejected", updatedAt: new Date() }).where(eq(withdrawals.id, withdrawalId));
    throw new AppError("Insufficient balance", 400);
  }

  let updatedStudent: typeof student;

  await db.transaction(async (tx) => {
    await tx.update(withdrawals).set({ status: "approved", verifiedAt: new Date(), updatedAt: new Date() }).where(eq(withdrawals.id, withdrawalId));

    const [updated] = await tx.update(students).set({ balance: student.balance - withdrawal.amount, updatedAt: new Date() }).where(eq(students.id, student.id)).returning();
    updatedStudent = updated;

    await tx.insert(transactions).values({
      studentId: student.id,
      type: "withdrawal",
      status: "completed",
      amount: -withdrawal.amount,
      balanceAfter: updated.balance,
      description: withdrawal.reason,
      withdrawalId: withdrawal.id,
    });
  });

  const staffMember = await db.query.staff.findFirst({ where: eq(staff.id, staffId) });

  await notifyParentsOfStudent({
    studentId: student.id,
    studentName: student.fullName,
    type: "withdrawal_success",
    title: "Withdrawal Alert",
    body: `${withdrawal.amount.toLocaleString()} Frw withdrawn. Reason: ${withdrawal.reason}. Staff: ${staffMember?.fullName}. Balance: ${updatedStudent!.balance.toLocaleString()} Frw`,
  });

  return {
    withdrawalId: withdrawal.id,
    amount: withdrawal.amount,
    reason: withdrawal.reason,
    status: "approved",
    balanceAfter: updatedStudent!.balance,
    student: { id: student.id, fullName: student.fullName },
    staff: { fullName: staffMember?.fullName },
  };
};

export const reverseWithdrawalService = async (
  staffId: string,
  schoolId: string,
  withdrawalId: string,
  input: ReverseWithdrawalInput
) => {
  const { reason } = input;

  const withdrawal = await db.query.withdrawals.findFirst({
    where: and(eq(withdrawals.id, withdrawalId), eq(withdrawals.status, "approved")),
  });

  if (!withdrawal) {
    throw new AppError("Withdrawal not found or cannot be reversed", 404);
  }

  const student = await db.query.students.findFirst({
    where: and(eq(students.id, withdrawal.studentId), eq(students.schoolId, schoolId)),
  });

  if (!student) {
    throw new AppError("Student does not belong to your school", 403);
  }

  let updatedStudent: typeof student;

  await db.transaction(async (tx) => {
    await tx.update(withdrawals).set({ status: "reversed", reversalReason: reason, reversedBy: staffId, reversedAt: new Date(), updatedAt: new Date() }).where(eq(withdrawals.id, withdrawalId));

    const [updated] = await tx.update(students).set({ balance: student.balance + withdrawal.amount, updatedAt: new Date() }).where(eq(students.id, student.id)).returning();
    updatedStudent = updated;

    await tx.insert(transactions).values({
      studentId: student.id,
      type: "deposit",
      status: "reversed",
      amount: withdrawal.amount,
      balanceAfter: updated.balance,
      description: `Reversal: ${reason}`,
      withdrawalId: withdrawal.id,
    });
  });

  await db.insert(auditLogs).values({
    actorType: "staff",
    actorId: staffId,
    action: "WITHDRAWAL_REVERSED",
    targetType: "withdrawal",
    targetId: withdrawalId,
    metadata: { reason, amount: withdrawal.amount, studentId: student.id },
  });

  await notifyParentsOfStudent({
    studentId: student.id,
    studentName: student.fullName,
    type: "withdrawal_reversed",
    title: "Withdrawal Reversed",
    body: `${withdrawal.amount.toLocaleString()} Frw refunded to ${student.fullName}. Reason: ${reason}`,
  });

  return {
    withdrawalId,
    status: "reversed",
    refundedAmount: withdrawal.amount,
    balanceAfter: updatedStudent!.balance,
    reason,
  };
};

export const getWithdrawalHistoryService = async (
  parentId: string,
  input: WithdrawalHistoryInput
) => {
  const { studentId, status, page, limit } = input;
  const offset = (page - 1) * limit;

  const linkedStudents = await db
    .select({ studentId: parentStudents.studentId })
    .from(parentStudents)
    .where(eq(parentStudents.parentId, parentId));

  const linkedIds = linkedStudents.map((l) => l.studentId);

  if (linkedIds.length === 0) {
    return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
  }

  const whereClauses = [eq(students.schoolId, student.schoolId)];
  if (studentId) whereClauses.push(eq(withdrawals.studentId, studentId));
  if (status) whereClauses.push(eq(withdrawals.status, status));

  const history = await db.query.withdrawals.findMany({
    where: and(...whereClauses),
    orderBy: [desc(withdrawals.createdAt)],
    limit,
    offset,
  });

  const filtered = history.filter((w) => linkedIds.includes(w.studentId));

  const enriched = await Promise.all(
    filtered.map(async (w) => {
      const s = await db.query.students.findFirst({ where: eq(students.id, w.studentId) });
      const st = await db.query.staff.findFirst({ where: eq(staff.id, w.staffId) });
      return { ...w, student: { id: s?.id, fullName: s?.fullName }, staff: { fullName: st?.fullName } };
    })
  );

  return {
    data: enriched,
    meta: { page, limit, total: enriched.length, totalPages: Math.ceil(enriched.length / limit) },
  };
};
