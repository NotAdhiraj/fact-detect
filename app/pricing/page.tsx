import Link from "next/link";

function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`h-3.5 w-3.5 shrink-0 ${className}`}
    >
      <path
        fillRule="evenodd"
        d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Pricing() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden px-4 md:pt-48 pt-28 pb-16">
      <div className="hero-glow" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-6xl text-center">
        <h1 className="text-3xl font-semibold leading-none tracking-tight text-zinc-100 sm:text-5xl md:text-[70px]">
          Plans and Pricing
        </h1>

        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-zinc-500">
          Start free, upgrade when your team needs more.
        </p>

        <div className="mt-14 grid items-stretch gap-4 sm:grid-cols-3">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-[#262626] bg-[#141414] p-8 text-left transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
            <h2 className="text-sm font-semibold text-zinc-100">Free</h2>
            <p className="mt-3 text-[40px] font-semibold leading-none text-zinc-100">
              $0
            </p>
            <p className="mt-1.5 text-xs text-zinc-500">
              Per document, no account needed
            </p>

            <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              For individuals
            </p>

            <ul className="mt-3 space-y-2.5">
              {[
                "Paste or upload documents",
                "Up to 10 claims per check",
                "Instant verification",
                "No account required",
              ].map((feat) => (
                <li
                  key={feat}
                  className="flex items-center gap-2.5 text-xs text-zinc-400"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5">
                    <Check className="text-zinc-500" />
                  </span>
                  {feat}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <Link
                href="/check"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-white/20 hover:text-zinc-100 hover:scale-[1.02]"
              >
                Get started free
              </Link>
            </div>
          </div>

          {/* Pro */}
          <div className="flex flex-col rounded-2xl border border-[#262626] bg-[#141414] p-8 text-left transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-100">Pro</h2>
              <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                Popular
              </span>
            </div>
            <p className="mt-3 text-[40px] font-semibold leading-none text-zinc-100">
              Contact us
            </p>
            <p className="mt-1.5 text-xs text-zinc-500">For growing teams</p>

            <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Everything in Free, plus
            </p>

            <ul className="mt-3 space-y-2.5">
              {[
                "Unlimited claims per document",
                "PDF upload support",
                "Priority verification speed",
                "Email support",
              ].map((feat) => (
                <li
                  key={feat}
                  className="flex items-center gap-2.5 text-xs text-zinc-400"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5">
                    <Check className="text-zinc-500" />
                  </span>
                  {feat}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <Link
                href="/check"
                className="inline-flex w-full items-center justify-center rounded-full bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-900 transition-all duration-200 hover:bg-white hover:scale-[1.02]"
              >
                Get started with Pro
              </Link>
            </div>
          </div>

          {/* Companies — inverted */}
          <div className="flex flex-col rounded-2xl bg-[#f5f5f5] p-8 text-left transition-all duration-200 hover:-translate-y-0.5">
            <h2 className="text-sm font-semibold text-zinc-900">Companies</h2>
            <p className="mt-3 text-[40px] font-semibold leading-none text-zinc-900">
              Custom
            </p>
            <p className="mt-1.5 text-xs text-zinc-500">
              For organizations
            </p>

            <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Everything in Pro, plus
            </p>

            <ul className="mt-3 space-y-2.5">
              {[
                "Shareable public doc links",
                "Community flagging on claims",
                "Multiple docs per workspace",
                "Dedicated support",
              ].map((feat) => (
                <li
                  key={feat}
                  className="flex items-center gap-2.5 text-xs text-zinc-600"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/5">
                    <Check className="text-zinc-500" />
                  </span>
                  {feat}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <Link
                href="/companies"
                className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-zinc-800 hover:scale-[1.02]"
              >
                Get started with Companies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
