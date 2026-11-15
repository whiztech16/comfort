import { useEffect, useState } from "react";
import ComposerPrompt from "../../components/posts/ComposerPrompt";
import CategoryFilter from "../../components/posts/CategoryFilter";
import type { Filter } from "../../components/posts/CategoryFilter";
import PostCard from "../../components/posts/PostCard";
import { apiRequest, getUser } from "../../lib/api";
import { formatApiPost } from "../../lib/postApi";
import type { ApiPost } from "../../lib/postApi";
import type { Post } from "../../types/posts";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// "Personal Experiences" -> "personal-experiences", the format the API accepts
const toSlug = (label: string) =>
  label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function HomePage() {
  const user = getUser();
  const name = user?.profile?.displayName || "Friend";

  const [filter, setFilter] = useState<Filter>("All");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = filter !== "All" ? `?category=${encodeURIComponent(toSlug(filter))}` : "";
    apiRequest<{ items: ApiPost[] }>(`/api/v1/posts${params}`)
      .then((res) => {
        if (active) setPosts((res.data?.items ?? []).map(formatApiPost));
      })
      .catch(() => {
        if (active) setPosts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter]);

  return (
    <div className="space-y-5">
      <div className="relative isolate space-y-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-8 -inset-y-8 -z-10 bg-[radial-gradient(45%_60%_at_15%_25%,rgba(111,140,202,0.35),transparent_70%),radial-gradient(40%_55%_at_92%_80%,rgba(165,190,238,0.5),transparent_70%)]"
        />
        <section>
          <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
            {greeting()},
            <br />
            {name} <span aria-hidden>💙</span>
          </h1>
          <p className="mt-1.5 text-[0.9rem] text-navy/60">
            Kind people. Real conversations. A safer space.
          </p>
        </section>

        <ComposerPrompt name={name} />
      </div>

      <CategoryFilter value={filter} onChange={setFilter} />

      <section aria-label="Posts" className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy border-t-transparent" />
          </div>
        ) : posts.length > 0 ? (
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