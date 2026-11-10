import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import {
  comforts,
  conversationParticipants,
  messages,
  profiles,
  reports,
  userSettings,
  users,
} from "../../db/schema";

export async function findComfortSender(comfortId: string, recipientId: string) {
  const [row] = await db
    .select({ senderId: comforts.senderId })
    .from(comforts)
    .where(and(eq(comforts.id, comfortId), eq(comforts.recipientId, recipientId)))
    .limit(1);
  return row?.senderId ?? null;
}

export async function findMessageSender(messageId: string, reporterId: string) {
  const [row] = await db
    .select({ senderId: messages.senderId })
    .from(messages)
    .innerJoin(
      conversationParticipants,
      and(
        eq(conversationParticipants.conversationId, messages.conversationId),
        eq(conversationParticipants.userId, reporterId),
      ),
    )
    .where(eq(messages.id, messageId))
    .limit(1);
  return row?.senderId ?? null;
}

export async function findReportableUser(username: string) {
  const [row] = await db
    .select({ userId: profiles.userId, discoverable: userSettings.discoverableProfile })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .innerJoin(userSettings, eq(userSettings.userId, profiles.userId))
    .where(and(eq(profiles.username, username), eq(users.status, "active"), eq(users.onboardingCompleted, true)))
    .limit(1);
  return row ?? null;
}

// Safe to repeat: the unique (reporter, target type, target id) index ignores duplicates.
export async function insertReport(data: {
  reporterId: string;
  reportedUserId: string;
  targetType: "post" | "comfort" | "message" | "user";
  targetId: string;
  reason: string;
  description: string | null;
}) {
  await db
    .insert(reports)
    .values(data)
    .onConflictDoNothing({ target: [reports.reporterId, reports.targetType, reports.targetId] });
}