import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { conversationParticipants, users } from "../db/schema";

export async function findSocketUser(userId: string) {
  const [row] = await db
    .select({ status: users.status, onboarded: users.onboardingCompleted })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

export async function isParticipant(conversationId: string, userId: string) {
  const [row] = await db
    .select({ id: conversationParticipants.id })
    .from(conversationParticipants)
    .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, userId)))
    .limit(1);
  return !!row;
}