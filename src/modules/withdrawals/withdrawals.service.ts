import { eq, and, desc, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../../config/db";
import {
  withdrawals,
  students,
  staff as staffSchema,
  transactions,
  parentStudents,
  parents,
  notifications,
  auditLogs,
} from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";
import { notifyParentsOfStudent } from "../notifications/notifications.service";
import { generateId } from "../../utils/codes";
import type {
  CreateWithdrawalInput,
  VerifyWithdrawalPinInput,
  ReverseWithdrawalInput,
  WithdrawalHistoryInput,
} from "./withdrawals.schema";
import type { StaffRole } from "../../types/index";

// ─────────────────────────────────────────
// POST /withdrawals
// ─── Staff initiates a withdrawal request
// ─── Status starts as "pending" until student verifies PIN
// ─────────────────────────────────────────
export const createWithdrawalService = async (
  staffId: string,
  schoolId: string,
  input: CreateWithdrawalInput
) => {
  const { studentId, amount, reason } = input;

  // ─── Verify student exists and belongs to staff's school ───
  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  if (student.schoolId !== schoolId) {
    throw new AppError("Student does not belong to your school", 403);
  }

  if (student.isFrozen) {
    throw new AppError("This student account is frozen", 403);
  }

  // ─── Check sufficient balance ───
  if (student.balance < amount) {
    throw new AppError(
      `Insufficient balance. Current balance: ${student.balance} Frw`,
      400
    );
  }

  // ─── Create pending withdrawal ───
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

  // ─── Create audit log ───
  await db.insert(auditLogs).values({
    actorType: "staff",
    actorId: staffId,
    action: "WITHDRAWAL_INITIATED",
    targetType: "withdrawal",
    targetId: newWithdrawal.id,
    metadata: { amount, reason, studentId },
  });

  return {
    id: newWithdrawal.id,
    studentId: newWithdrawal.studentId,
    amount: newWithdrawal.amount,
    reason: newWithdrawal.reason,
    status: newWithdrawal.status,
    createdAt: newWithdrawal.createdAt,
  };
};

// ─────────────────────────────────────────
// POST /withdrawals/:id/verify-pin
// ─── Student enters PIN to approve withdrawal
// ─── If PIN correct → approve, deduct balance, notify parents
// ─── If PIN wrong → reject withdrawal
// ─────────────────────────────────────────
export const verifyWithdrawalPinService = async (
  withdrawalId: string,
  input: VerifyWithdrawalPinInput
) => {
  const { pin } = input;

  // ─── Find pending withdrawal ───
  const withdrawal = await db.query.withdrawals.findFirst({
    where: and(
      eq(withdrawals.id, withdrawalId),
      eq(withdrawals.status, "pending")
    ),
  });

  if (!withdrawal) {
    throw new AppError("Withdrawal not found or already processed", 404);
  }

  // ─── Fetch student PIN hash ───
  const student = await db.query.students.findFirst({
    where: eq(students.id, withdrawal.studentId),
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  // ─── Verify PIN against hash ───
  const isPinValid = await bcrypt.compare(pin, student.pinHash);
  if (!isPinValid) {
    // ─── Mark withdrawal as rejected ───
    await db
      .update(withdrawals)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(withdrawals.id, withdrawalId));

    // ─── Audit log for failed PIN attempt ───
    await db.insert(auditLogs).values({
      actorType: "student",
      actorId: student.id,
      action: "WITHDRAWAL_PIN_FAILED",
      targetType: "withdrawal",
      targetId: withdrawalId,
      metadata: { amount: withdrawal.amount, reason: withdrawal.reason },
    });

    throw new AppError("Invalid PIN. Withdrawal rejected.", 400);
  }

  // ─── PIN correct — process withdrawal atomically ───
  await db.transaction(async (tx) => {
    // ─── 1. Mark withdrawal as approved ───
    await tx
      .update(withdrawals)
      .set({
        status: "approved",
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(withdrawals.id, withdrawalId));

    // ─── 2. Deduct student balance ───
    const currentStudent = await tx.query.students.findFirst({
      where: eq(students.id, withdrawal.studentId),
    });

    const newBalance = currentStudent!.balance - withdrawal.amount;

    const [updatedStudent] = await tx
      .update(students)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(students.id, withdrawal.studentId))
      .returning();

    // ─── 3. Create transaction record ───
    await tx.insert(transactions).values({
      studentId: withdrawal.studentId,
      type: "withdrawal",
      status: "completed",
      amount: -withdrawal.amount,
      balanceAfter: updatedStudent.balance,
      description: `Withdrawal: ${withdrawal.reason}`,
      withdrawalId: withdrawal.id,
    });

    // ─── 4. Audit log ───
    await tx.insert(auditLogs).values({
      actorType: "student",
      actorId: student.id,
      action: "WITHDRAWAL_APPROVED",
      targetType: "withdrawal",
      targetId: withdrawalId,
      metadata: {
        amount: withdrawal.amount,
        reason: withdrawal.reason,
        newBalance: updatedStudent.balance,
      },
    });
  });

  // ─── 5. Notify all linked parents (outside transaction) ───
  const linkedParents = await db.query.parentStudents.findMany({
    where: eq(parentStudents.studentId, withdrawal.studentId),
  });

  await Promise.all(
    linkedParents.map(async (link) => {
      const parent = await db.query.parents.findFirst({
        where: eq(parents.id, link.parentId),
      });

      if (parent?.fcmToken) {
        await notifyParentsOfStudent({
          studentId: withdrawal.studentId,
          studentName: student.fullName,
          type: "withdrawal_success",
          title: "Withdrawal Completed",
          body: `${withdrawal.amount.toLocaleString()} Frw withdrawn for ${withdrawal.reason}. New balance: ${student.balance - withdrawal.amount} Frw.`,
          parentId: parent.id,
        });
      }
    })
  );

  return {
    id: withdrawal.id,
    status: "approved",
    amount: withdrawal.amount,
    reason: withdrawal.reason,
    newBalance: student.balance - withdrawal.amount,
  };
};

// ─────────────────────────────────────────
// POST /withdrawals/:id/reverse
// ─── Staff reverses an approved withdrawal (e.g. mistake)
// ─── Credits balance back, updates records, notifies parents
// ─────────────────────────────────────────
export const reverseWithdrawalService = async (
  staffId: string,
  staffRole: StaffRole,
  withdrawalId: string,
  input: ReverseWithdrawalInput
) => {
  const { reason } = input;

  // ─── Only admin can reverse withdrawals ───
  if (staffRole !== "admin") {
    throw new AppError("Only admin can reverse withdrawals", 403);
  }

  // ─── Find approved withdrawal ───
  const withdrawal = await db.query.withdrawals.findFirst({
    where: and(
      eq(withdrawals.id, withdrawalId),
      eq(withdrawals.status, "approved")
    ),
  });

  if (!withdrawal) {
    throw new AppError("Approved withdrawal not found", 404);
  }

  // ─── Process reversal atomically ───
  await db.transaction(async (tx) => {
    // ─── 1. Mark withdrawal as reversed ───
    await tx
      .update(withdrawals)
      .set({
        status: "reversed",
        reversalReason: reason,
        reversedBy: staffId,
        reversedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(withdrawals.id, withdrawalId));

    // ─── 2. Credit balance back ───
    const currentStudent = await tx.query.students.findFirst({
      where: eq(students.id, withdrawal.studentId),
    });

    const newBalance = currentStudent!.balance + withdrawal.amount;

    const [updatedStudent] = await tx
      .update(students)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(students.id, withdrawal.studentId))
      .returning();

    // ─── 3. Create reversal transaction ───
    await tx.insert(transactions).values({
      studentId: withdrawal.studentId,
      type: "withdrawal",
      status: "reversed",
      amount: withdrawal.amount,
      balanceAfter: updatedStudent.balance,
      description: `Reversal: ${reason}`,
      withdrawalId: withdrawal.id,
    });

    // ─── 4. Audit log ───
    await tx.insert(auditLogs).values({
      actorType: "admin",
      actorId: staffId,
      action: "WITHDRAWAL_REVERSED",
      targetType: "withdrawal",
      targetId: withdrawalId,
      metadata: {
        amount: withdrawal.amount,
        reason,
        newBalance: updatedStudent.balance,
      },
    });
  });

  // ─── 5. Notify parents ───
  const student = await db.query.students.findFirst({
    where: eq(students.id, withdrawal.studentId),
  });

  const linkedParents = await db.query.parentStudents.findMany({
    where: eq(parentStudents.studentId, withdrawal.studentId),
  });

  await Promise.all(
    linkedParents.map(async (link) => {
      const parent = await db.query.parents.findFirst({
        where: eq(parents.id, link.parentId),
      });

      if (parent?.fcmToken) {
        await notifyParentsOfStudent({
          studentId: withdrawal.studentId,
          studentName: student?.fullName || "your child",
          type: "withdrawal_reversed",
          title: "Withdrawal Reversed",
          body: `${withdrawal.amount.toLocaleString()} Frw has been returned to ${student?.fullName}'s account. Reason: ${reason}`,
          parentId: parent.id,
        });
      }
    })
  );

  return {
    id: withdrawal.id,
    status: "reversed",
    amount: withdrawal.amount,
    reason,
    newBalance: student!.balance + withdrawal.amount,
  };
};

// ─────────────────────────────────────────
// GET /withdrawals/history
// ─── Staff views withdrawal history for their school
// ─── Parents can view withdrawals for their linked students
// ─────────────────────────────────────────
export const getWithdrawalHistoryService = async (
  schoolId: string | undefined,
  parentId: string | undefined,
  input: WithdrawalHistoryInput
) => {
  const { studentId, status, page, limit } = input;
  const offset = (page - 1) * limit;

  // ─── Build where clause based on caller type ───
  let whereClause;
  if (schoolId) {
    // Staff: filter by school via student relationship
    whereClause = eq(students.schoolId, schoolId);
    if (studentId) {
      whereClause = and(whereClause, eq(withdrawals.studentId, studentId));
    }
  } else if (parentId) {
    // Parent: filter by linked students only
    const linkedStudentIds = (
      await db.query.parentStudents.findMany({
        where: eq(parentStudents.parentId, parentId),
        columns: { studentId: true },
      })
    ).map((l) => l.studentId);

    whereClause = eq(withdrawals.studentId, linkedStudentIds[0]);
    if (studentId) {
      if (!linkedStudentIds.includes(studentId)) {
        throw new AppError("Student not linked to your account", 403);
      }
      whereClause = eq(withdrawals.studentId, studentId);
    } else {
      whereClause = inArray(withdrawals.studentId, linkedStudentIds);
    }
  }

  if (status) {
    whereClause = and(whereClause, eq(withdrawals.status, status));
  }

  const history = await db
    .select({
      id: withdrawals.id,
      studentId: withdrawals.studentId,
      amount: withdrawals.amount,
      reason: withdrawals.reason,
      status: withdrawals.status,
      verifiedAt: withdrawals.verifiedAt,
      reversalReason: withdrawals.reversalReason,
      createdAt: withdrawals.createdAt,
    })
    .from(withdrawals)
    .innerJoin(students, eq(withdrawals.studentId, students.id))
    .where(whereClause)
    .orderBy(desc(withdrawals.createdAt))
    .limit(limit)
    .offset(offset);

  // ─── Attach student and staff info ───
  const enriched = await Promise.all(
    history.map(async (w) => {
      const student = await db.query.students.findFirst({
        where: eq(students.id, w.studentId),
      });
      const staff = await db.query.staff.findFirst({
        where: eq(staffSchema.id, w.staffId),
      });

      return {
        ...w,
        student: {
          id: student?.id,
          fullName: student?.fullName,
        },
        staff: {
          id: staff?.id,
          fullName: staff?.fullName,
        },
      };
    })
  );

  const [{ total }] = await db
    .select({ total: count() })
    .from(withdrawals)
    .innerJoin(students, eq(withdrawals.studentId, students.id))
    .where(whereClause);

  return {
    data: enriched,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
