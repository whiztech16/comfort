import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/comfort-logo.png";
import authBg from "../assets/images/loginbackground.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-b from-[#86aee0] via-[#f0cba6] to-[#b9a99c] px-5 py-24">
      {/* Background photo (the gradient above shows if the photo is missing) */}
      <img
        src={authBg}
        alt=""
        aria-hidden
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />

      {/* Logo */}
      <Link
        to="/"
        aria-label="Comfort home"
        className="absolute left-5 top-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-calm md:left-12 md:top-6"
      >
        <img src={logo} alt="Comfort" className="h-5 w-auto md:h-8" />
      </Link>

      <main className="w-full max-w-[26rem]">{children}</main>
    </div>
  );
}