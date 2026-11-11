import { useEffect, useRef } from "react";
import { Outlet, useLocation, useMatch } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";
import ToastProvider from "../context/ToastProvider";
import UnlockChatsModal from "../components/messaging/UnlockChatsModal";

export default function AppLayout() {
  const inConversation = useMatch("/comforts/conversations/:conversationId");
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Always reset scroll to the top on page transition (e.g. clicking avatar)
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ToastProvider>
      {/* Full-screen column: header / scrollable content / bottom-nav */}
      <div className="flex h-dvh flex-col bg-white">
        {/* Desktop sidebar (absolutely positioned, doesn't affect column flow) */}
        <SideNav />

        {/* Top header — never scrolls away */}
        <AppHeader />

        {/* Scrollable content area or full-height chat container */}
        <main
          ref={mainRef}
          className={`min-h-0 flex-1 lg:pl-64 ${
            inConversation
              ? "flex flex-col overflow-hidden"
              : "overflow-y-auto"
          }`}
        >
          <div
            className={`mx-auto w-full max-w-xl px-4 lg:max-w-2xl lg:px-8 ${
              inConversation
                ? "flex h-full min-h-0 flex-1 flex-col pt-3 pb-2"
                : "pt-5 pb-10 lg:pt-8 lg:pb-12"
            }`}
          >
            <Outlet />
          </div>
        </main>

        {/* Bottom nav sits in normal flow — always visible above content */}
        <BottomNav />

        {/* Modal to prompt for chat passphrase if local key is missing */}
        <UnlockChatsModal />
      </div>
    </ToastProvider>
  );
}
