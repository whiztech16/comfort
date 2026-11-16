import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, UserX } from "lucide-react";
import ProfileAvatar from "../../components/profile/ProfileAvatar";
import PostCard from "../../components/posts/PostCard";
import SafetyMenu from "../../components/safety/SafetyMenu";
import { EmptyState } from "../../components/shared/States";
import { PrimaryLink } from "../../components/shared/PrimaryButton";
import { apiRequest } from "../../lib/api";
import { blockByUsernameApi } from "../../lib/blocksApi";
import { formatApiPost, type ApiPost } from "../../lib/postApi";
import type { Post } from "../../types/posts";

type PublicProfile = {
  displayName: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  isSelf: boolean;
};

type PostsPage = { items: ApiPost[]; nextCursor: string | null; hasMore: boolean };

type Status = "loading" | "ready" | "notFound" | "failed";

async function fetchPosts(username: string, cursor: string | null) {
  const params = new URLSearchParams({ limit: "20" });
  if (cursor) params.set("cursor", cursor);
  const res = await apiRequest<PostsPage>(
    `/api/v1/users/${encodeURIComponent(username)}/posts?${params.toString()}`
  );
  return res.data ?? null;
}

export default function UserProfilePage() {
  const { username = "" } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>("loading");
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setProfile(null);
    setPosts([]);
    setCursor(null);
    setHasMore(false);

    apiRequest<{ profile: PublicProfile }>(`/api/v1/users/${encodeURIComponent(username)}`)
      .then(async (res) => {
        if (!active) return;
        const found = res.data?.profile;
        if (!found) {
          setStatus("notFound");
          return;
        }
        setProfile(found);
        setStatus("ready");
        if (found.isSelf) return;
        const page = await fetchPosts(username, null).catch(() => null);
        if (!active || !page) return;
        setPosts(page.items.map(formatApiPost));
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch((err) => {
        if (!active) return;
        setStatus(err?.status === 404 || err?.status === 422 ? "notFound" : "failed");
      });

    return () => {
      active = false;
    };
  }, [username, attempt]);

  async function loadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const page = await fetchPosts(username, cursor).catch(() => null);
    if (page) {
      setPosts((prev) => [...prev, ...page.items.map(formatApiPost)]);
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    }
    setLoadingMore(false);
  }

  if (profile?.isSelf) {
    return <Navigate to="/profile" replace />;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-deep" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <EmptyState
        icon={UserX}
        title="We couldn't load that profile"
        text="Check your connection and try again."
        action={
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="inline-flex h-12 items-center rounded-full bg-[#f1f3fa] px-6 text-[0.9rem] font-medium text-navy transition hover:bg-[#e8ecf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            Try again
          </button>
        }
      />
    );
  }

  if (status === "notFound" || !profile) {
    return (
      <EmptyState
        icon={UserX}
        title="We couldn't find that profile"
        text="It may not exist, or it may be private."
        action={<PrimaryLink to="/home">Go to home</PrimaryLink>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/home"
        className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        Back
      </Link>

      <section className="rounded-3xl border border-black/[0.06] bg-gradient-to-b from-[#eef2fb] to-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <ProfileAvatar name={profile.displayName} photoUrl={profile.avatarUrl} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-navy">
              {profile.displayName}
            </h1>
            <p className="text-[0.9rem] text-navy/60">@{profile.username}</p>
          </div>
          <SafetyMenu
            name={profile.displayName}
            reportKind="profile"
            onBlock={() => blockByUsernameApi(profile.username)}
            onBlockChange={() => navigate("/home", { replace: true })}
          />
        </div>

        {profile.bio ? (
          <p className="mt-4 text-[0.9375rem] leading-[1.6] text-navy/80">{profile.bio}</p>
        ) : null}
      </section>

      <section aria-labelledby="their-posts" className="space-y-4">
        <h2 id="their-posts" className="text-[1.125rem] font-semibold text-navy">
          Posts
        </h2>

        {posts.length > 0 ? (
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
            title="No public posts yet"
            text={`${profile.displayName} hasn't shared anything publicly.`}
          />
        )}
      </section>
    </div>
  );
}