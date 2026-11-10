import { type SQL, and, desc, eq, isNull, notExists, or, sql } from "drizzle-orm";
import { db } from "../../db";
import { blocks, categories, posts, profiles, users } from "../../db/schema";
import type { Cursor } from "../../shared/cursor";

const columns = (viewerId: string) => ({
  id: posts.id,
  content: posts.content,
  isAnonymous: posts.isAnonymous,
  createdAt: posts.createdAt,
  cursorTs: sql<string>`${posts.createdAt}::text`,
  isMine: sql<boolean>`${posts.authorId} = ${viewerId}`,
  category: { id: categories.id, name: categories.name, slug: categories.slug },
  profile: {
    displayName: profiles.displayName,
    username: profiles.username,
    avatarUrl: profiles.avatarUrl,
  },
});

const visibleTo = (viewerId: string): SQL =>
  and(
    eq(posts.status, "active"),
    isNull(posts.deletedAt),
    eq(users.status, "active"),
    notExists(
      db
        .select({ one: blocks.id })
        .from(blocks)
        .where(
          or(
            and(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, posts.authorId)),
            and(eq(blocks.blockerId, posts.authorId), eq(blocks.blockedId, viewerId)),
          ),
        ),
    ),
  )!;

const base = (viewerId: string) =>
  db
    .select(columns(viewerId))
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .innerJoin(categories, eq(categories.id, posts.categoryId))
    .leftJoin(profiles, eq(profiles.userId, posts.authorId));

export async function findCategoryById(id: string) {
  const [row] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, id)).limit(1);
  return row ?? null;
}

export async function insertPost(
  authorId: string,
  data: { content: string; categoryId: string; isAnonymous: boolean },
) {
  const [row] = await db.insert(posts).values({ authorId, ...data }).returning({ id: posts.id });
  return row!.id;
}

export async function findVisiblePost(id: string, viewerId: string) {
  const [row] = await base(viewerId)
    .where(and(eq(posts.id, id), visibleTo(viewerId)))
    .limit(1);
  return row ?? null;
}

export function listFeed(opts: {
  viewerId: string;
  limit: number;
  categorySlug?: string;
  cursor?: Cursor;
}) {
  const conditions: SQL[] = [visibleTo(opts.viewerId)];
  if (opts.categorySlug) conditions.push(eq(categories.slug, opts.categorySlug));
  if (opts.cursor) {
    conditions.push(
      sql`(${posts.createdAt}, ${posts.id}) < (${opts.cursor.ts}::timestamptz, ${opts.cursor.id}::uuid)`,
    );
  }
  return base(opts.viewerId)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(opts.limit + 1);
}

export async function softDeleteOwnPost(id: string, authorId: string) {
  const rows = await db
    .update(posts)
    .set({ deletedAt: new Date() })
    .where(and(eq(posts.id, id), eq(posts.authorId, authorId), isNull(posts.deletedAt), eq(posts.status, "active")))
    .returning({ id: posts.id });
  return rows.length > 0;
}

export type PostRow = NonNullable<Awaited<ReturnType<typeof findVisiblePost>>>;
export function listByAuthor(opts: {
  viewerId: string;
  authorId: string;
  limit: number;
  cursor?: Cursor;
  excludeAnonymous: boolean;
}) {
  const conditions: SQL[] = [visibleTo(opts.viewerId), eq(posts.authorId, opts.authorId)];
  if (opts.excludeAnonymous) conditions.push(eq(posts.isAnonymous, false));
  if (opts.cursor) {
    conditions.push(
      sql`(${posts.createdAt}, ${posts.id}) < (${opts.cursor.ts}::timestamptz, ${opts.cursor.id}::uuid)`,
    );
  }
  return base(opts.viewerId)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(opts.limit + 1);
}
export async function findVisiblePostAuthor(id: string, viewerId: string) {
  const [row] = await db
    .select({ authorId: posts.authorId })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.id, id), visibleTo(viewerId)))
    .limit(1);
  return row?.authorId ?? null;
}