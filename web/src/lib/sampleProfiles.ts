import type { Profile } from "../types/profile";

// Temporary stand-in for the backend. Changes last until the page is refreshed.
const me: Profile = {
  username: "fortune",
  displayName: "Fortune",
  email: "fortune@example.com",
  bio: "Building, learning, and enjoying the journey. Here for kindness and good conversations. 💙",
  photoUrl: null,
  acceptsComforts: true,
};

const others: Profile[] = [
  {
    username: "maya",
    displayName: "Maya",
    email: "maya@example.com",
    bio: "Small steps, big changes.",
    photoUrl: null,
    acceptsComforts: true,
  },
  {
    username: "jay",
    displayName: "Jay",
    email: "jay@example.com",
    bio: "Faith, family and good music.",
    photoUrl: null,
    acceptsComforts: false, // shows what "where permitted" looks like
  },
  {
    username: "zoe",
    displayName: "Zoe",
    email: "zoe@example.com",
    bio: "Reader. Walker. Always rooting for you.",
    photoUrl: null,
    acceptsComforts: true,
  },
];

export function getMyProfile() {
  return me;
}

export function updateMyProfile(
  patch: Partial<Pick<Profile, "displayName" | "username" | "bio" | "photoUrl">>
) {
  Object.assign(me, patch);
}

export function getProfileByUsername(username: string) {
  return username === me.username
    ? me
    : others.find((profile) => profile.username === username);
}

export function isUsernameTaken(username: string) {
  return others.some((profile) => profile.username === username);
}

export type MessagingPreference = "everyone" | "interacted" | "nobody";

let messagingPreference: MessagingPreference = "everyone";

export function getMessagingPreference(): MessagingPreference {
  return messagingPreference;
}

export function setMessagingPreference(pref: MessagingPreference) {
  messagingPreference = pref;
  me.acceptsComforts = pref !== "nobody";
}

export interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  blockedAt: string;
}

const blockedUsers: BlockedUser[] = [];

export function getBlockedUsers(): BlockedUser[] {
  return [...blockedUsers];
}

export function blockUser(username: string, displayName: string) {
  if (!blockedUsers.some((u) => u.username === username)) {
    blockedUsers.push({
      id: `b-${Date.now()}`,
      username,
      displayName,
      blockedAt: "Just now",
    });
  }
}

export function unblockUser(username: string) {
  const index = blockedUsers.findIndex((u) => u.username === username);
  if (index !== -1) {
    blockedUsers.splice(index, 1);
  }
}
