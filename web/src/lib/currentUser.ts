import { getMyProfile } from "./sampleProfiles";

// Temporary: this will come from the logged-in person's account
export const currentUser = {
  get name() {
    return getMyProfile().displayName;
  },
};