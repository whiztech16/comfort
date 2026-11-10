export type PublicIdentity = {
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  isAnonymous: boolean;
};

type IdentitySource = {
  isAnonymous: boolean;
  profile: { displayName: string; username: string; avatarUrl: string | null } | null;
};

const ANONYMOUS: Readonly<PublicIdentity> = Object.freeze({
  displayName: "Anonymous",
  username: null,
  avatarUrl: null,
  isAnonymous: true,
});

const DELETED: Readonly<PublicIdentity> = Object.freeze({
  displayName: "Deleted user",
  username: null,
  avatarUrl: null,
  isAnonymous: false,
});

export function toPublicIdentity(source: IdentitySource): PublicIdentity {
  if (source.isAnonymous) return { ...ANONYMOUS };
  if (!source.profile) return { ...DELETED };
  return {
    displayName: source.profile.displayName,
    username: source.profile.username,
    avatarUrl: source.profile.avatarUrl,
    isAnonymous: false,
  };
}