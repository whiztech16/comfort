import { getUser } from "./api";

export const currentUser = {
  get name() {
    return getUser()?.profile?.displayName ?? "A friend";
  },
};