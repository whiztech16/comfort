import { House, Search, Plus, Mail, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItemType = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export const navItems: NavItemType[] = [
  { to: "/home", label: "Home", icon: House },
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/posts/new", label: "Create", icon: Plus },
  // The badge is a placeholder until the backend provides the real count
  { to: "/inbox", label: "Inbox", icon: Mail, badge: 2 },
  { to: "/profile", label: "Profile", icon: User },
];