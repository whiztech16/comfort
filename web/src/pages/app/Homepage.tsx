import { useState } from "react";
import ComposerPrompt from "../../components/posts/ComposerPrompt";
import CategoryFilter from "../../components/posts/CategoryFilter";
import type { Filter } from "../../components/posts/CategoryFilter";
import PostCard from "../../components/posts/PostCard";
import { samplePosts } from "../../lib/samplePosts";

import { currentUser } from "../../lib/currentUser";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const [filter, setFilter] = useState<Filter>("All");

  const posts =
    filter === "All"
      ? samplePosts
      : samplePosts.filter((post) => post.category === filter);

  return (
    <div className="space-y-5">
      {/* Greeting and share bar, over a soft blue tint so the glass shows */}
      <div className="relative isolate space-y-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-8 -inset-y-8 -z-10 bg-[radial-gradient(45%_60%_at_15%_25%,rgba(111,140,202,0.35),transparent_70%),radial-gradient(40%_55%_at_92%_80%,rgba(165,190,238,0.5),transparent_70%)]"
        />

        <section>
          <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
            {greeting()},
            <br />
            {currentUser.name} <span aria-hidden>💙</span>
          </h1>
          <p className="mt-1.5 text-[0.9rem] text-navy/60">
            Kind people. Real conversations. A safer space.
          </p>
        </section>

        <ComposerPrompt name={currentUser.name} />
      </div>

      <CategoryFilter value={filter} onChange={setFilter} />

      <section aria-label="Posts" className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <p className="rounded-2xl border border-black/[0.06] p-5 text-center text-[0.9rem] text-navy/60">
            Nothing here yet. Be the first to share something kind.
          </p>
        )}
      </section>
    </div>
  );
}