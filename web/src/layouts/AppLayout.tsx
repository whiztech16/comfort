import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";

export default function AppLayout() {
  return (
    <div className="min-h-svh bg-white">
      <SideNav />

      <div className="lg:pl-64">
        <AppHeader />
        <main className="mx-auto w-full max-w-xl px-4 pb-32 pt-5 lg:max-w-2xl lg:px-8 lg:pb-12 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Soft blue glow behind the bottom nav, so the glass has colour to show (phones only) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-44 bg-gradient-to-t from-brand/30 via-brand/10 to-transparent lg:hidden"
      />

      <BottomNav />
    </div>
  );
}