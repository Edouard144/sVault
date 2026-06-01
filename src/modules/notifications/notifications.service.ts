import { eq, and, desc, count } from "drizzle-orm";
import { db } from "../../config/db";
import {
  notifications,
  parents,
  parentStudents,
} from "../../db/schema/index";
import { messaging } from "../../config/firebase";
import { AppError } from "../../middleware/error.middleware";
import type { NotificationType } from "../../types/index";

interface NotifyParentsInput {
  studentId: string;
  studentName: string;
  type: NotificationType;
  title: string;
  body: string;
}

export const notifyParentsOfStudent = async (
  input: NotifyParentsInput
): Promise<void> => {
  const { studentId, type, title, body } = input;

  const links = await db
    .select({ parentId: parentStudents.parentId })
    .from(parentStudents)
    .where(eq(parentStudents.studentId, studentId));

  if (links.length === 0) return;

  const parentIds = links.map((l) => l.parentId);

  await Promise.all(
    parentIds.map(async (parentId) => {
      const parent = await db.query.parents.findFirst({
        where: eq(parents.id, parentId),
      });

      if (!parent) return;

      await db.insert(notifications).values({
        parentId,
        type,
        title,
        body,
        isRead: false,
        isPushed: false,
      });

      if (!parent.fcmToken) return;

      try {
        await messaging.send({
          token: parent.fcmToken,
          notification: { title, body },
          data: {
            type,
            studentId,
            timestamp: new Date().toISOString(),
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "svault_transactions",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
              },
            },
          },
        });

        await db
          .update(notifications)
          .set({ isPushed: true })
          .where(
            and(
              eq(notifications.parentId, parentId),
              eq(notifications.type, type)
            )
          );
      } catch (err) {
        console.error(
          `[Firebase] Failed to push notification to parent ${parentId}:`,
          err
        );
      }
    })
  );
};

export const getNotificationsService = async (
  parentId: string,
  page: number,
  limit: number
) => {
  const offset = (page - 1) * limit;

  const list = await db
    .select()
    .from(notifications)
    .where(eq(notifications.parentId, parentId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(notifications)
    .where(eq(notifications.parentId, parentId));

  const [{ unread }] = await db
    .select({ unread: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.parentId, parentId),
        eq(notifications.isRead, false)
      )
    );

  return {
    data: list,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount: unread,
    },
  };
};

export const markNotificationReadService = async (
  parentId: string,
  notificationId: string
) => {
  const notification = await db.query.notifications.findFirst({
    where: and(
      eq(notifications.id, notificationId),
      eq(notifications.parentId, parentId)
    ),
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.isRead) {
    return { id: notificationId, isRead: true };
  }

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));

  return { id: notificationId, isRead: true };
};
