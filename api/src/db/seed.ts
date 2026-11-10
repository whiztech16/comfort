import { db } from "./index";
import { categories } from "./schema";

const SEED = [
  { name: "Encouragement", slug: "encouragement", description: "Words that lift someone up" },
  { name: "Personal Experiences", slug: "personal-experiences", description: "Moments from your own journey" },
  { name: "Everyday Thoughts", slug: "everyday-thoughts", description: "Small reflections from daily life" },
  { name: "Faith and Scripture", slug: "faith-and-scripture", description: "Faith, verses and spiritual encouragement" },
  { name: "Prayers", slug: "prayers", description: "Prayers shared and requested" },
  { name: "Affirmations", slug: "affirmations", description: "Positive words to remind and renew" },
  { name: "General Kindness", slug: "general-kindness", description: "Everyday acts and words of kindness" },
];

async function main() {
  for (const c of SEED) {
    await db
      .insert(categories)
      .values(c)
      .onConflictDoUpdate({ target: categories.slug, set: { name: c.name, description: c.description } });
  }
  console.log(`Seeded ${SEED.length} categories`);
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error("Seed failed:", err instanceof Error ? err.message : "unknown error");
    process.exit(1);
  });