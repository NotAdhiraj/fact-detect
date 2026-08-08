"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/support", label: "FAQ" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-5">
      <nav className="flex w-full max-w-[600px] items-center justify-between rounded-full border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-md sm:max-w-none sm:justify-center sm:gap-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-full px-3 py-2 text-base font-semibold tracking-tight text-zinc-100 transition hover:bg-white/5"
        >
          <Image
            src="/logo.png"
            alt="Fact Rot logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full"
            priority
          />
          <span className="hidden sm:inline">Fact Rot</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-base text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA buttons */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/companies"
            className={`rounded-full border px-5 py-2.5 text-base font-medium transition-all duration-200 ${
              pathname === "/companies"
                ? "border-white/20 text-zinc-100"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200 hover:scale-[1.02]"
            }`}
          >
            For Companies
          </Link>
          <Link
            href="/check"
            className={`rounded-full px-5 py-2.5 text-base font-medium transition-all duration-200 ${
              pathname === "/check"
                ? "bg-white text-zinc-900"
                : "bg-zinc-100 text-zinc-900 hover:bg-white hover:scale-[1.02]"
            }`}
          >
            Check a Doc
          </Link>
        </div>

        {/* Mobile: Check a Doc CTA + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link
            href="/check"
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
              pathname === "/check"
                ? "bg-white text-zinc-900"
                : "bg-zinc-100 text-zinc-900 hover:bg-white hover:scale-[1.02]"
            }`}
          >
            Check a Doc
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M2 3.75A.75.75 0 0 1 2.75 3h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75ZM2 8a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 8Zm0 4.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="absolute left-4 right-4 top-[72px] mx-auto w-full max-w-[600px] rounded-2xl border border-white/10 bg-black/80 p-3 backdrop-blur-md sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 text-base text-zinc-300 transition hover:bg-white/5 hover:text-zinc-100"
            >
              {link.label}
            </Link>
          ))}
          <div className="my-1 border-t border-white/10" />
          <Link
            href="/companies"
            onClick={() => setMobileOpen(false)}
            className="block rounded-xl px-4 py-3 text-base text-zinc-300 transition hover:bg-white/5 hover:text-zinc-100"
          >
            For Companies
          </Link>
        </div>
      )}
    </header>
  );
}
