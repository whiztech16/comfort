import { asc } from "drizzle-orm";
import { db } from "../../db";
import { categories } from "../../db/schema";

export function findAllCategories() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
    })
    .from(categories)
    .orderBy(asc(categories.createdAt), asc(categories.name));
}