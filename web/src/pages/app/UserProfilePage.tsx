import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, UserX } from "lucide-react";
import ProfileAvatar from "../../components/profile/ProfileAvatar";
import PostCard from "../../components/posts/PostCard";
import SafetyMenu from "../../components/safety/SafetyMenu";
import { EmptyState } from "../../components/shared/States";
import {
  PrimaryLink,
} from "../../components/shared/PrimaryButton";
import { getMyProfile, getProfileByUsername } from "../../lib/sampleProfiles";
import { postsByAuthor } from "../../lib/samplePosts";

export default function UserProfilePage() {
  const { username = "" } = useParams();
  const profile = getProfileByUsername(username);

  // Your own public name takes you to your own profile
  if (username === getMyProfile().username) {
    return <Navigate to="/profile" replace />;
  }

  if (!profile) {
    return (
      <EmptyState
        icon={UserX}
        title="We couldn’t find that profile"
        text="It may not exist, or it may be private."
        action={<PrimaryLink to="/home">Go to home</PrimaryLink>}
      />
    );
  }

  // Only named public posts are listed. Anonymous posts never appear on a profile.
  const posts = postsByAuthor(profile.username);

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
          <ProfileAvatar name={profile.displayName} photoUrl={profile.photoUrl} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-navy">
              {profile.displayName}
            </h1>
            <p className="text-[0.9rem] text-navy/60">@{profile.username}</p>
          </div>
          <SafetyMenu name={profile.displayName} reportKind="profile" />
        </div>

        {profile.bio ? (
          <p className="mt-4 text-[0.9375rem] leading-[1.6] text-navy/80">
            {profile.bio}
          </p>
        ) : null}

        <div className="mt-5">
          {profile.acceptsComforts ? (
            <PrimaryLink
              to={`/send-comfort/to/${profile.username}`}
              className="gap-2"
            >
              <Send aria-hidden className="h-4 w-4" strokeWidth={2} />
              Send Comfort
            </PrimaryLink>
          ) : (
            <p className="rounded-2xl bg-[#f1f3fa] p-4 text-[0.8125rem] leading-snug text-navy/70">
              {profile.displayName} isn’t receiving Comforts right now.
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
            text={`${profile.displayName} hasn’t shared anything publicly.`}
          />
        )}
      </section>
    </div>
  );
}