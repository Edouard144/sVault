import { eq, and, desc, sql, count } from "drizzle-orm";
import { db } from "../../config/db";
import {
  transactions,
  students,
  parentStudents,
  deposits,
  withdrawals,
} from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";

// ─────────────────────────────────────────
// GET /analytics/dashboard
// ─── Parent's overview: total deposits, withdrawals, current balance, recent activity
// ─────────────────────────────────────────
export const getParentDashboardService = async (
  parentId: string
) => {
  const linkedStudents = await db
    .select({ studentId: parentStudents.studentId })
    .from(parentStudents)
    .where(eq(parentStudents.parentId, parentId));

  const studentIds = linkedStudents.map((l) => l.studentId);

  if (studentIds.length === 0) {
    return {
      totalDeposits: 0,
      totalWithdrawals: 0,
      currentBalance: 0,
      transactionCount: 0,
      recentTransactions: [],
    };
  }

  const depositStats = await db
    .select({
      total: sql<number>`SUM(${deposits.amount})`.as("total"),
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(deposits)
    .where(
      and(
        sql`${deposits.studentId} IN ${studentIds}`,
        eq(deposits.status, "completed")
      )
    );

  const withdrawalStats = await db
    .select({
      total: sql<number>`SUM(${withdrawals.amount})`.as("total"),
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(withdrawals)
    .where(
      and(
        sql`${withdrawals.studentId} IN ${studentIds}`,
        eq(withdrawals.status, "approved")
      )
    );

  const balanceRows = await db
    .select({
      balance: sql<number>`SUM(${students.balance})`.as("balance"),
    })
    .from(students)
    .where(sql`${students.id} IN ${studentIds}`);

  const recentTransactions = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      description: transactions.description,
      createdAt: transactions.createdAt,
      studentId: transactions.studentId,
    })
    .from(transactions)
    .where(sql`${transactions.studentId} IN ${studentIds}`)
    .orderBy(desc(transactions.createdAt))
    .limit(10);

  const studentsWithNames = await Promise.all(
    recentTransactions.map(async (tx) => {
      const student = await db.query.students.findFirst({
        where: eq(students.id, tx.studentId),
        columns: { fullName: true },
      });
      return { ...tx, studentName: student?.fullName };
    })
  );

  return {
    totalDeposits: Number(depositStats[0]?.total) || 0,
    totalWithdrawals: Number(withdrawalStats[0]?.total) || 0,
    currentBalance: Number(balanceRows[0]?.balance) || 0,
    transactionCount: Number(depositStats[0]?.count || 0) + Number(withdrawalStats[0]?.count || 0),
    recentTransactions: studentsWithNames,
  };
};

// ─────────────────────────────────────────
// GET /analytics/students/:id/spending
// ─── Spending breakdown for a single student over time
// ─────────────────────────────────────────
export const getStudentSpendingService = async (
  parentId: string,
  studentId: string
) => {
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

  const withdrawalTransactions = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      description: transactions.description,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.studentId, studentId),
        eq(transactions.type, "withdrawal")
      )
    )
    .orderBy(desc(transactions.createdAt));

  const depositTransactions = await db.query.transactions.findMany({
    where: and(
      eq(transactions.studentId, studentId),
      eq(transactions.type, "deposit")
    ),
    orderBy: desc(transactions.createdAt),
  });

  const totalDeposited = depositTransactions.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );
  const totalWithdrawn = Math.abs(
    withdrawalTransactions.reduce((sum, tx) => sum + tx.amount, 0)
  );

  const byCategory: Record<string, number> = {};
  for (const tx of withdrawalTransactions) {
    const category = tx.description || "Other";
    byCategory[category] = (byCategory[category] || 0) + Math.abs(tx.amount);
  }

  return {
    student: {
      id: student.id,
      fullName: student.fullName,
      currentBalance: student.balance,
    },
    summary: {
      totalDeposited,
      totalWithdrawn,
      netSavings: totalDeposited - totalWithdrawn,
    },
    categories: Object.entries(byCategory).map(([name, amount]) => ({
      name,
      amount,
    })),
    recentWithdrawals: withdrawalTransactions,
  };
};
