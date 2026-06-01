import { messaging } from "../../config/firebase";
import { db } from "../../config/db";
import { notifications, parents } from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";
import { eq } from "drizzle-orm";

export const notifyParentsOfStudent = async ({
  studentId,
  studentName,
  type,
  title,
  body,
  parentId,
}: {
  studentId: string;
  studentName: string;
  type: "deposit_success" | "withdrawal_success" | "withdrawal_reversed" | "low_balance" | "account_frozen";
  title: string;
  body: string;
  parentId?: string;
}) => {
  const targetParentIds = parentId ? [parentId] : (
    await db.query.parentStudents.findMany({
      where: eq(parentStudents.studentId, studentId),
      columns: { parentId: true },
    })
  ).map((l) => l.parentId);

  const notificationRecords = targetParentIds.map((pid) => ({
    parentId: pid,
    type,
    title,
    body,
    isRead: false,
    isPushed: false,
  }));

  await db.insert(notifications).values(notificationRecords);

  await Promise.all(
    targetParentIds.map(async (pid) => {
      const parent = await db.query.parents.findFirst({ where: eq(parents.id, pid) });
      if (!parent?.fcmToken) return;

      try {
        await messaging.send({
          token: parent.fcmToken,
          notification: { title, body },
          data: {
            type,
            studentId,
            studentName,
          },
        });

        await db.update(notifications).set({ isPushed: true }).where(eq(notifications.parentId, pid));
      } catch (err) {
        console.error("Firebase push failed for parent", pid, err);
      }
    })
  );
};
