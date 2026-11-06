import { House, Mail, Plus, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItemType = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

// Order: Home, Comforts, [+ button], Profile
export const navItems: NavItemType[] = [
  { to: "/home",      label: "Home",     icon: House },
  { to: "/comforts",  label: "Comforts", icon: Mail, badge: 2 },
  { to: "/posts/new", label: "New post", icon: Plus },
  { to: "/profile",   label: "Profile",  icon: User },
];
