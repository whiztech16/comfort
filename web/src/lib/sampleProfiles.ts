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
    bio: "Small steps, big changes.",
    photoUrl: null,
    acceptsComforts: true,
  },
  {
    username: "jay",
    displayName: "Jay",
    bio: "Faith, family and good music.",
    photoUrl: null,
    acceptsComforts: false, // shows what "where permitted" looks like
  },
  {
    username: "zoe",
    displayName: "Zoe",
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