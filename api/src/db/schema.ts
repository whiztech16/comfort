import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

export const userStatus = pgEnum("user_status", ["active", "suspended", "deleted"]);
export const appearance = pgEnum("appearance", ["system", "light", "dark"]);
export const messagingPreference = pgEnum("messaging_preference", [
  "allowed",
  "requests_only",
  "off",
]);
export const postStatus = pgEnum("post_status", ["active", "removed"]);
export const appreciationType = pgEnum("appreciation_type", [
  "this_helped",
  "made_my_day",
  "thank_you",
]);
export const notificationType = pgEnum("notification_type", [
  "new_comfort",
  "new_message",
  "new_appreciation",
]);
export const notificationEntity = pgEnum("notification_entity", ["comfort", "conversation"]);
export const linkRequestStatus = pgEnum("link_request_status", [
  "pending",
  "approved",
  "consumed",
  "expired",
]);
export const reportTargetType = pgEnum("report_target_type", [
  "post",
  "comfort",
  "message",
  "user",
]);
export const reportStatus = pgEnum("report_status", [
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    googleSub: text("google_sub").unique(),
    emailVerifiedAt: timestamptz("email_verified_at"),
    onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
    status: userStatus("status").notNull().default("active"),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: timestamptz("locked_until"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`),
    check("users_email_length", sql`char_length(${t.email}) <= 254`),
    check("users_has_credential", sql`${t.passwordHash} is not null or ${t.googleSub} is not null`),
  ],
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    username: text("username").notNull().unique(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    avatarPublicId: text("avatar_public_id"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    check("profiles_username_format", sql`${t.username} ~ '^[a-z0-9_]{3,20}$'`),
    check("profiles_display_name_length", sql`char_length(${t.displayName}) between 1 and 50`),
    check("profiles_bio_length", sql`${t.bio} is null or char_length(${t.bio}) <= 300`),
  ],
);

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  notifyNewComforts: boolean("notify_new_comforts").notNull().default(true),
  notifyNewMessages: boolean("notify_new_messages").notNull().default(true),
  notifyAppreciation: boolean("notify_appreciation").notNull().default(true),
  appearance: appearance("appearance").notNull().default("system"),
  allowPrivateMessages: messagingPreference("allow_private_messages").notNull().default("allowed"),
  discoverableProfile: boolean("discoverable_profile").notNull().default(true),
  updatedAt: timestamptz("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    familyId: uuid("family_id").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    deviceLabel: text("device_label"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    lastUsedAt: timestamptz("last_used_at").notNull().defaultNow(),
    expiresAt: timestamptz("expires_at").notNull(),
    revokedAt: timestamptz("revoked_at"),
    replacedById: uuid("replaced_by_id").references((): AnyPgColumn => refreshTokens.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("refresh_tokens_user_idx").on(t.userId),
    index("refresh_tokens_family_idx").on(t.familyId),
    check("refresh_tokens_hash_length", sql`char_length(${t.tokenHash}) = 64`),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamptz("expires_at").notNull(),
    usedAt: timestamptz("used_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("password_reset_tokens_user_idx").on(t.userId),
    check("password_reset_tokens_hash_length", sql`char_length(${t.tokenHash}) = 64`),
  ],
);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
});

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    content: text("content").notNull(),
    isAnonymous: boolean("is_anonymous").notNull(),
    status: postStatus("status").notNull().default("active"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    deletedAt: timestamptz("deleted_at"),
  },
  (t) => [
    index("posts_feed_idx").on(t.createdAt.desc(), t.id.desc()),
    index("posts_category_feed_idx").on(t.categoryId, t.createdAt.desc()),
    index("posts_author_idx").on(t.authorId, t.createdAt.desc()),
    check("posts_content_length", sql`char_length(${t.content}) between 1 and 2000`),
  ],
);

export const comforts = pgTable(
  "comforts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "set null" }),
    contentCiphertext: text("content_ciphertext").notNull(),
    contentNonce: text("content_nonce").notNull(),
    keyVersion: integer("key_version").notNull(),
    isAnonymous: boolean("is_anonymous").notNull(),
    openedAt: timestamptz("opened_at"),
    appreciationType: appreciationType("appreciation_type"),
    appreciatedAt: timestamptz("appreciated_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("comforts_recipient_idx").on(t.recipientId, t.createdAt.desc()),
    index("comforts_sender_idx").on(t.senderId, t.createdAt.desc()),
    index("comforts_post_idx").on(t.postId),
    check("comforts_not_self", sql`${t.senderId} <> ${t.recipientId}`),
    check("comforts_nonce_length", sql`char_length(${t.contentNonce}) = 16`),
    check("comforts_ciphertext_length", sql`char_length(${t.contentCiphertext}) between 1 and 12000`),
    check(
      "comforts_appreciation_consistent",
      sql`(${t.appreciationType} is null) = (${t.appreciatedAt} is null)`,
    ),
  ],
);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceComfortId: uuid("source_comfort_id")
    .notNull()
    .unique()
    .references(() => comforts.id, { onDelete: "cascade" }),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
  lastMessageAt: timestamptz("last_message_at"),
});

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamptz("joined_at").notNull().defaultNow(),
    lastReadAt: timestamptz("last_read_at"),
  },
  (t) => [
    uniqueIndex("conversation_participants_unique_idx").on(t.conversationId, t.userId),
    index("conversation_participants_user_idx").on(t.userId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ciphertext: text("ciphertext").notNull(),
    nonce: text("nonce").notNull(),
    senderWrappedKey: text("sender_wrapped_key").notNull(),
    recipientWrappedKey: text("recipient_wrapped_key").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("messages_conversation_idx").on(t.conversationId, t.createdAt, t.id),
    check("messages_ciphertext_length", sql`char_length(${t.ciphertext}) between 1 and 12000`),
    check("messages_nonce_length", sql`char_length(${t.nonce}) = 32`),
    check("messages_sender_key_length", sql`char_length(${t.senderWrappedKey}) = 108`),
    check("messages_recipient_key_length", sql`char_length(${t.recipientWrappedKey}) = 108`),
  ],
);

export const userKeys = pgTable(
  "user_keys",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    publicKey: text("public_key").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [check("user_keys_public_key_length", sql`char_length(${t.publicKey}) = 44`)],
);

export const keyBackups = pgTable(
  "key_backups",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    encryptedPrivateKey: text("encrypted_private_key").notNull(),
    nonce: text("nonce").notNull(),
    version: integer("version").notNull().default(1),
    updatedAt: timestamptz("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    check("key_backups_blob_length", sql`char_length(${t.encryptedPrivateKey}) = 64`),
    check("key_backups_nonce_length", sql`char_length(${t.nonce}) = 32`),
  ],
);

export const deviceLinkRequests = pgTable(
  "device_link_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ephemeralPublicKey: text("ephemeral_public_key").notNull(),
    status: linkRequestStatus("status").notNull().default("pending"),
    encryptedPayload: text("encrypted_payload"),
    expiresAt: timestamptz("expires_at").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("device_link_requests_user_idx").on(t.userId),
    check("device_link_requests_key_length", sql`char_length(${t.ephemeralPublicKey}) = 44`),
    check(
      "device_link_requests_payload_length",
      sql`${t.encryptedPayload} is null or char_length(${t.encryptedPayload}) = 108`,
    ),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationType("type").notNull(),
    entityType: notificationEntity("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("notifications_recipient_idx").on(t.recipientId, t.createdAt.desc()),
    index("notifications_unread_idx").on(t.recipientId, t.isRead),
  ],
);

export const blocks = pgTable(
  "blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("blocks_pair_idx").on(t.blockerId, t.blockedId),
    index("blocks_blocked_idx").on(t.blockedId),
    check("blocks_not_self", sql`${t.blockerId} <> ${t.blockedId}`),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
    reportedUserId: uuid("reported_user_id").references(() => users.id, { onDelete: "set null" }),
    targetType: reportTargetType("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    reason: text("reason").notNull(),
    description: text("description"),
    status: reportStatus("status").notNull().default("pending"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    reviewedAt: timestamptz("reviewed_at"),
  },
  (t) => [
    uniqueIndex("reports_once_per_target_idx").on(t.reporterId, t.targetType, t.targetId),
    index("reports_status_idx").on(t.status, t.createdAt),
    index("reports_target_idx").on(t.targetType, t.targetId),
    check("reports_reason_length", sql`char_length(${t.reason}) between 1 and 100`),
    check(
      "reports_description_length",
      sql`${t.description} is null or char_length(${t.description}) <= 2000`,
    ),
  ],
);