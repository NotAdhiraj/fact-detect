import Link from "next/link";

const logos = [
  "Vercel",
  "Stripe",
  "Linear",
  "Notion",
  "Figma",
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Hero glow */}
      <div className="hero-glow" aria-hidden="true" />

      {/* Stat chips — scattered decorations */}
      <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
        <span className="absolute left-[8%] top-[22%] rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-zinc-500 backdrop-blur-sm">
          Docs Verified{" "}
          <span className="ml-1 font-semibold text-zinc-300">12,405</span>
        </span>
        <span className="absolute right-[10%] top-[18%] rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-zinc-500 backdrop-blur-sm">
          Claims Flagged{" "}
          <span className="ml-1 font-semibold text-zinc-300">340</span>
        </span>
        <span className="absolute bottom-[28%] left-[12%] rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-zinc-500 backdrop-blur-sm">
          Accuracy{" "}
          <span className="ml-1 font-semibold text-zinc-300">98.2%</span>
        </span>
        <span className="absolute bottom-[24%] right-[8%] rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-zinc-500 backdrop-blur-sm">
          Avg Check{" "}
          <span className="ml-1 font-semibold text-zinc-300">2.1s</span>
        </span>
      </div>

      {/* Hero content */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h1 className="text-6xl font-bold tracking-[-0.04em] text-zinc-100 sm:text-7xl md:text-8xl">
          Catch facts
          <br />
          before they rot
        </h1>

        <p className="mx-auto mt-6 max-w-md text-base text-zinc-500">
          Your docs go stale silently. We check every claim against the live web
          and tell you what still holds up.
        </p>

        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            href="/check"
            className="rounded-full bg-zinc-100 px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-white"
          >
            Check a Document
          </Link>
          <Link
            href="/companies"
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-zinc-100"
          >
            For Companies
          </Link>
        </div>
      </div>

      {/* Trusted-by logos */}
      <div className="relative z-10 mt-20 text-center">
        <p className="mb-6 text-[10px] uppercase tracking-widest text-zinc-700">
          Trusted by
        </p>
        <div className="flex items-center justify-center gap-8">
          {logos.map((name) => (
            <span
              key={name}
              className="text-sm font-semibold text-zinc-700 transition-colors hover:text-zinc-500"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
