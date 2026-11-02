import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";

export default function AppLayout() {
  return (
    // Full viewport height flex column — keeps BottomNav pinned at the bottom
    // without relying on `position:fixed` (which breaks when ancestors use
    // backdrop-filter or transform on some mobile browsers).
    <div className="flex h-dvh flex-col bg-white">
      {/* Desktop sidebar — still uses its own fixed positioning */}
      <SideNav />

      {/* Content column: header + scrollable main */}
      <div className="flex min-h-0 flex-1 flex-col lg:pl-64">
        <AppHeader />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-xl px-4 pb-6 pt-5 lg:max-w-2xl lg:px-8 lg:pt-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav — sits in normal flow at the foot of the flex column */}
      <BottomNav />
    </div>
  );
}
