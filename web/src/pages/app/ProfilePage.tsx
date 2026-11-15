import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PenLine, Settings } from "lucide-react";
import ProfileAvatar from "../../components/profile/ProfileAvatar";
import PostCard from "../../components/posts/PostCard";
import { EmptyState } from "../../components/shared/States";
import { PrimaryLink } from "../../components/shared/PrimaryButton";
import { apiRequest, getUser, setUser } from "../../lib/api";
import type { UserState } from "../../lib/api";
import { formatApiPost } from "../../lib/postApi";
import type { ApiPost } from "../../lib/postApi";
import type { Post } from "../../types/posts";

type PostsPage = { items: ApiPost[]; nextCursor: string | null; hasMore: boolean };

export default function ProfilePage() {
  const [profile, setProfile] = useState(getUser()?.profile);
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    apiRequest<{ user: UserState }>("/api/v1/auth/me")
      .then((res) => {
        if (res.data?.user) {
          setUser(res.data.user);
          setProfile(res.data.user.profile);
        }
      })
      .catch(() => {});
  }, []);

  const fetchPage = useCallback(async (after: string | null) => {
    const params = new URLSearchParams({ limit: "20" });
    if (after) params.set("cursor", after);
    const res = await apiRequest<PostsPage>(`/api/v1/users/me/posts?${params.toString()}`);
    return res.data;
  }, []);

  const loadFirst = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const data = await fetchPage(null);
      setPosts((data?.items ?? []).map((p) => formatApiPost(p)));
      setCursor(data?.nextCursor ?? null);
      setHasMore(Boolean(data?.hasMore));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    void loadFirst();
  }, [loadFirst]);

  async function loadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(cursor);
      const next = (data?.items ?? []).map((p) => formatApiPost(p));
      setPosts((prev) => [...prev, ...next]);
      setCursor(data?.nextCursor ?? null);
      setHasMore(Boolean(data?.hasMore));
    } catch {
      // Keep what we have; the button stays so they can try again
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/[0.06] bg-gradient-to-b from-[#eef2fb] to-white p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <ProfileAvatar name={profile?.displayName ?? "?"} photoUrl={profile?.avatarUrl ?? null} />
          <div className="min-w-0">
            <h1 className="truncate text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-navy">
              {profile?.displayName ?? ""}
            </h1>
            <p className="text-[0.9rem] text-navy/60">@{profile?.username ?? ""}</p>
          </div>
        </div>

        {profile?.bio ? (
          <p className="mt-4 text-[0.9375rem] leading-[1.6] text-navy/80">{profile.bio}</p>
        ) : (
          <p className="mt-4 text-[0.875rem] text-navy/50">
            Add a short bio so people know a little about you.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <PrimaryLink to="/profile/edit" className="gap-2">
            <PenLine aria-hidden className="h-4 w-4" strokeWidth={2} />
            Edit profile
          </PrimaryLink>
          <Link
            to="/settings"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#f1f3fa] px-6 text-[0.9rem] font-medium text-navy transition hover:bg-[#e8ecf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            <Settings aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            Settings
          </Link>
        </div>
      </section>

      <section aria-labelledby="my-posts" className="space-y-4">
        <div>
          <h2 id="my-posts" className="text-[1.125rem] font-semibold text-navy">
            Your posts
          </h2>
          <p className="mt-0.5 text-[0.8125rem] text-navy/55">
            Anonymous and private posts show here only for you. Others never see them on your profile.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy border-t-transparent" />
          </div>
        ) : failed ? (
          <EmptyState
            title="We couldn't load your posts"
            text="Check your connection and try again."
            action={
              <button
                type="button"
                onClick={() => void loadFirst()}
                className="inline-flex h-12 items-center rounded-full bg-[#f1f3fa] px-6 text-[0.9rem] font-medium text-navy transition hover:bg-[#e8ecf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
              >
                Try again
              </button>
            }
          />
        ) : posts.length > 0 ? (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {hasMore ? (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="inline-flex h-12 items-center rounded-full bg-[#f1f3fa] px-6 text-[0.9rem] font-medium text-navy transition hover:bg-[#e8ecf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            title="You haven't shared anything yet"
            text="When you're ready, share what's on your mind."
            action={<PrimaryLink to="/posts/new">Create a post</PrimaryLink>}
          />
        )}
      </section>
    </div>
  );
}