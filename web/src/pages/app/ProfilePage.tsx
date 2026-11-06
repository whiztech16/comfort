import { Link } from "react-router-dom";
import { PenLine, Settings } from "lucide-react";
import ProfileAvatar from "../../components/profile/ProfileAvatar";
import PostCard from "../../components/posts/PostCard";
import { EmptyState } from "../../components/shared/States";
import { PrimaryLink } from "../../components/shared/PrimaryButton";
import { getMyProfile } from "../../lib/sampleProfiles";
import { myPosts } from "../../lib/samplePosts";

export default function ProfilePage() {
  const profile = getMyProfile();
  const posts = myPosts();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/[0.06] bg-gradient-to-b from-[#eef2fb] to-white p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <ProfileAvatar name={profile.displayName} photoUrl={profile.photoUrl} />
          <div className="min-w-0">
            <h1 className="truncate text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-navy">
              {profile.displayName}
            </h1>
            <p className="text-[0.9rem] text-navy/60">@{profile.username}</p>
          </div>
        </div>

        {profile.bio ? (
          <p className="mt-4 text-[0.9375rem] leading-[1.6] text-navy/80">
            {profile.bio}
          </p>
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
            Anonymous posts show here only for you. Others never see them on your
            profile.
          </p>
        </div>

        {posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <EmptyState
            title="You haven’t shared anything yet"
            text="When you’re ready, share what’s on your mind."
            action={<PrimaryLink to="/posts/new">Create a post</PrimaryLink>}
          />
        )}
      </section>
    </div>
  );
}