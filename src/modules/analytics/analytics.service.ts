import { eq, and, desc, gte, sql, count, sum } from "drizzle-orm";
import { db } from "../../config/db";
import {
  transactions,
  deposits,
  withdrawals,
  students,
  parentStudents,
} from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";
import dayjs from "dayjs";

export const getDashboardAnalyticsService = async (parentId: string) => {
  const links = await db
    .select({ studentId: parentStudents.studentId })
    .from(parentStudents)
    .where(eq(parentStudents.parentId, parentId));

  const studentIds = links.map((l) => l.studentId);

  if (studentIds.length === 0) {
    return {
      totalBalance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      studentsCount: 0,
      students: [],
    };
  }

  const studentStats = await Promise.all(
    studentIds.map(async (studentId) => {
      const student = await db.query.students.findFirst({
        where: eq(students.id, studentId),
      });

      if (!student) return null;

      const [depositResult] = await db
        .select({ total: sql<number>`coalesce(sum(${deposits.amount}), 0)` })
        .from(deposits)
        .where(
          and(
            eq(deposits.studentId, studentId),
            eq(deposits.status, "completed")
          )
        );

      const [withdrawalResult] = await db
        .select({ total: sql<number>`coalesce(sum(${withdrawals.amount}), 0)` })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.studentId, studentId),
            eq(withdrawals.status, "approved")
          )
        );

      return {
        id: student.id,
        fullName: student.fullName,
        class: student.class,
        balance: student.balance,
        totalDeposited: Number(depositResult.total),
        totalWithdrawn: Number(withdrawalResult.total),
      };
    })
  );

  const validStats = studentStats.filter(Boolean) as NonNullable<typeof studentStats[number]>[];

  const totalBalance = validStats.reduce((sum, s) => sum + s.balance, 0);
  const totalDeposited = validStats.reduce((sum, s) => sum + s.totalDeposited, 0);
  const totalWithdrawn = validStats.reduce((sum, s) => sum + s.totalWithdrawn, 0);

  return {
    totalBalance,
    totalDeposited,
    totalWithdrawn,
    studentsCount: validStats.length,
    students: validStats,
  };
};

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
    throw new AppError("Student not linked to your account", 404);
  }

  const now = dayjs();
  const startOfWeek = now.startOf("week").toDate();
  const startOfMonth = now.startOf("month").toDate();
  const startOfYear = now.startOf("year").toDate();

  const [weekResult] = await db
    .select({ total: sql<number>`coalesce(sum(${withdrawals.amount}), 0)` })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.studentId, studentId),
        eq(withdrawals.status, "approved"),
        gte(withdrawals.createdAt, startOfWeek)
      )
    );

  const [monthResult] = await db
    .select({ total: sql<number>`coalesce(sum(${withdrawals.amount}), 0)` })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.studentId, studentId),
        eq(withdrawals.status, "approved"),
        gte(withdrawals.createdAt, startOfMonth)
      )
    );

  const [yearResult] = await db
    .select({ total: sql<number>`coalesce(sum(${withdrawals.amount}), 0)` })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.studentId, studentId),
        eq(withdrawals.status, "approved"),
        gte(withdrawals.createdAt, startOfYear)
      )
    );

  const last30Days = now.subtract(30, "day").toDate();

  const dailyBreakdown = await db
    .select({
      date: sql<string>`date_trunc('day', ${withdrawals.createdAt})::date`,
      total: sql<number>`coalesce(sum(${withdrawals.amount}), 0)`,
    })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.studentId, studentId),
        eq(withdrawals.status, "approved"),
        gte(withdrawals.createdAt, last30Days)
      )
    )
    .groupBy(sql`date_trunc('day', ${withdrawals.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${withdrawals.createdAt})::date`);

  const last12Months = now.subtract(12, "month").toDate();

  const monthlyBreakdown = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${withdrawals.createdAt}), 'YYYY-MM')`,
      total: sql<number>`coalesce(sum(${withdrawals.amount}), 0)`,
    })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.studentId, studentId),
        eq(withdrawals.status, "approved"),
        gte(withdrawals.createdAt, last12Months)
      )
    )
    .groupBy(sql`date_trunc('month', ${withdrawals.createdAt})`)
    .orderBy(sql`date_trunc('month', ${withdrawals.createdAt})`);

  return {
    summary: {
      thisWeek: Number(weekResult.total),
      thisMonth: Number(monthResult.total),
      thisYear: Number(yearResult.total),
    },
    dailyBreakdown,
    monthlyBreakdown,
  };
};

export const getStudentCategoriesService = async (
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
    throw new AppError("Student not linked to your account", 404);
  }

  const categories = await db
    .select({
      category: withdrawals.reason,
      total: sql<number>`coalesce(sum(${withdrawals.amount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.studentId, studentId),
        eq(withdrawals.status, "approved")
      )
    )
    .groupBy(withdrawals.reason)
    .orderBy(sql`sum(${withdrawals.amount}) desc`);

  const totalSpent = categories.reduce((sum, c) => sum + Number(c.total), 0);

  const withPercentage = categories.map((c) => ({
    category: c.category,
    total: Number(c.total),
    count: Number(c.count),
    percentage:
      totalSpent > 0 ? Math.round((Number(c.total) / totalSpent) * 100) : 0,
  }));

  return {
    categories: withPercentage,
    totalSpent,
  };
};
