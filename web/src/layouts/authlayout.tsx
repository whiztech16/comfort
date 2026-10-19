import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/comfort-logo.png";
import authBg from "../assets/images/loginbackground.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-svh w-full flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-[#86aee0] via-[#f0cba6] to-[#b9a99c] px-4 pt-14 pb-8 sm:px-6 sm:py-10">
      {/* Background photo (the gradient above shows if the photo is missing) */}
      <img
        src={authBg}
        alt=""
        aria-hidden
        className="fixed inset-0 -z-10 h-full w-full object-cover"
      />

      {/* Logo */}
      <Link
        to="/"
        aria-label="Comfort home"
        className="absolute left-4 top-4.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-calm sm:left-8 sm:top-6 md:left-12"
      >
        <img src={logo} alt="Comfort" className="h-5 w-auto sm:h-6 md:h-7" />
      </Link>

      <main className="my-auto w-full max-w-[24.5rem]">{children}</main>
    </div>
  );
}