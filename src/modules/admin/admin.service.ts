import { eq, count, sum, sql, desc } from "drizzle-orm";
import { db } from "../../config/db";
import {
  parents,
  students,
  schools,
  deposits,
  withdrawals,
  transactions,
  auditLogs,
} from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";

export const getAdminStatsService = async () => {
  const [
    [{ totalParents }],
    [{ totalStudents }],
    [{ totalSchools }],
    [{ totalDeposited }],
    [{ totalWithdrawn }],
    [{ pendingDeposits }],
  ] = await Promise.all([
    db.select({ totalParents: count() }).from(parents),
    db.select({ totalStudents: count() }).from(students),
    db.select({ totalSchools: count() }).from(schools),
    db
      .select({
        totalDeposited: sql<number>`coalesce(sum(${deposits.amount}), 0)`,
      })
      .from(deposits)
      .where(eq(deposits.status, "completed")),
    db
      .select({
        totalWithdrawn: sql<number>`coalesce(sum(${withdrawals.amount}), 0)`,
      })
      .from(withdrawals)
      .where(eq(withdrawals.status, "approved")),
    db
      .select({ pendingDeposits: count() })
      .from(deposits)
      .where(eq(deposits.status, "pending")),
  ]);

  const [{ totalBalance }] = await db
    .select({
      totalBalance: sql<number>`coalesce(sum(${students.balance}), 0)`,
    })
    .from(students);

  return {
    platform: {
      totalParents: Number(totalParents),
      totalStudents: Number(totalStudents),
      totalSchools: Number(totalSchools),
    },
    money: {
      totalDeposited: Number(totalDeposited),
      totalWithdrawn: Number(totalWithdrawn),
      totalBalanceInSystem: Number(totalBalance),
      pendingDeposits: Number(pendingDeposits),
    },
  };
};

export const toggleAccountFreezeService = async (
  accountId: string,
  freeze: boolean
) => {
  const parent = await db.query.parents.findFirst({
    where: eq(parents.id, accountId),
  });

  if (parent) {
    await db
      .update(parents)
      .set({ isFrozen: freeze, updatedAt: new Date() })
      .where(eq(parents.id, accountId));

    await db.insert(auditLogs).values({
      actorType: "admin",
      actorId: accountId,
      action: freeze ? "ACCOUNT_FROZEN" : "ACCOUNT_UNFROZEN",
      targetType: "parent",
      targetId: accountId,
      metadata: { freeze },
    });

    return {
      id: accountId,
      type: "parent",
      isFrozen: freeze,
      message: `Parent account ${freeze ? "frozen" : "unfrozen"} successfully`,
    };
  }

  const student = await db.query.students.findFirst({
    where: eq(students.id, accountId),
  });

  if (student) {
    await db
      .update(students)
      .set({ isFrozen: freeze, updatedAt: new Date() })
      .where(eq(students.id, accountId));

    await db.insert(auditLogs).values({
      actorType: "admin",
      actorId: accountId,
      action: freeze ? "ACCOUNT_FROZEN" : "ACCOUNT_UNFROZEN",
      targetType: "student",
      targetId: accountId,
      metadata: { freeze },
    });

    return {
      id: accountId,
      type: "student",
      isFrozen: freeze,
      message: `Student account ${freeze ? "frozen" : "unfrozen"} successfully`,
    };
  }

  throw new AppError("Account not found", 404);
};

export const getAuditLogsService = async (
  page: number,
  limit: number,
  action?: string
) => {
  const offset = (page - 1) * limit;

  const logs = await db
    .select()
    .from(auditLogs)
    .where(action ? eq(auditLogs.action, action) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(action ? eq(auditLogs.action, action) : undefined);

  return {
    data: logs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
