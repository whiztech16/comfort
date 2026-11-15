import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Send, UserX } from "lucide-react";
import ProfileAvatar from "../../components/profile/ProfileAvatar";
import PostCard from "../../components/posts/PostCard";
import SafetyMenu from "../../components/safety/SafetyMenu";
import { EmptyState } from "../../components/shared/States";
import { PrimaryLink } from "../../components/shared/PrimaryButton";
import { apiRequest, getUser } from "../../lib/api";
import { blockByUsernameApi } from "../../lib/blocksApi";

export default function UserProfilePage() {
  const { username = "" } = useParams();
  const navigate = useNavigate();
  const me = getUser();

  if (username === me?.profile?.username) {
    return <Navigate to="/profile" replace />;
  }

  const [profile, setProfile] = useState<{
    displayName: string;
    username: string;
    bio?: string | null;
    avatarUrl?: string | null;
    acceptsComforts?: boolean;
  } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);

    apiRequest<{ user: any }>(`/api/v1/users/${username}`)
      .then((res) => {
        const u = res.data?.user;
        if (!u) { setNotFound(true); return; }
        setProfile({
          displayName: u.profile?.displayName ?? username,
          username: u.profile?.username ?? username,
          bio: u.profile?.bio ?? null,
          avatarUrl: u.profile?.avatarUrl ?? null,
          acceptsComforts: u.settings?.allowMessageRequests !== false,
        });
        return apiRequest<{ items: any[] }>(`/api/v1/users/${username}/posts`);
      })
      .then((res) => {
        if (res) setPosts(res.data?.items ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-deep" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <EmptyState
        icon={UserX}
        title="We couldn't find that profile"
        text="It may not exist, or it may be private."
        action={<PrimaryLink to="/home">Go to home</PrimaryLink>}
      />
    );
  }

  const handle = profile.username;

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
          <ProfileAvatar name={profile.displayName} photoUrl={profile.avatarUrl ?? null} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-navy">
              {profile.displayName}
            </h1>
            <p className="text-[0.9rem] text-navy/60">@{profile.username}</p>
          </div>
          <SafetyMenu
            name={profile.displayName}
            reportKind="profile"
            onBlock={() => blockByUsernameApi(handle)}
            onBlockChange={() => navigate("/home", { replace: true })}
          />
        </div>

        {profile.bio ? (
          <p className="mt-4 text-[0.9375rem] leading-[1.6] text-navy/80">{profile.bio}</p>
        ) : null}

        <div className="mt-5">
          {profile.acceptsComforts !== false ? (
            <PrimaryLink to={`/send-comfort/to/${profile.username}`} className="gap-2">
              <Send aria-hidden className="h-4 w-4" strokeWidth={2} />
              Send Comfort
            </PrimaryLink>
          ) : (
            <p className="rounded-2xl bg-[#f1f3fa] p-4 text-[0.8125rem] leading-snug text-navy/70">
              {profile.displayName} isn't receiving Comforts right now.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="their-posts" className="space-y-4">
        <h2 id="their-posts" className="text-[1.125rem] font-semibold text-navy">
          Posts
        </h2>

        {posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
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