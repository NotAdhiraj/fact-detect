"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/support", label: "FAQ" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1.5 backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold tracking-tight text-zinc-100 transition hover:bg-white/5"
        >
          <span className="inline-block h-5 w-5 rounded-full bg-gradient-to-br from-white to-zinc-400" />
          Fact Rot
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ml-1 flex items-center gap-1.5">
          <Link
            href="/companies"
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              pathname === "/companies"
                ? "border-white/20 text-zinc-100"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
            }`}
          >
            For Companies
          </Link>
          <Link
            href="/check"
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              pathname === "/check"
                ? "bg-white text-zinc-900"
                : "bg-zinc-100 text-zinc-900 hover:bg-white"
            }`}
          >
            Check a Doc
          </Link>
        </div>
      </nav>
    </header>
  );
}
