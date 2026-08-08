import Link from "next/link";

const steps = [
  {
    number: "1",
    heading: "Paste or upload",
    description:
      "Drop in a PDF or paste text directly — we accept any document with factual claims.",
  },
  {
    number: "2",
    heading: "AI extracts every claim",
    description:
      "Our model pulls out concrete facts: dates, numbers, names, pricing, and compatibility statements.",
  },
  {
    number: "3",
    heading: "Verified against live data",
    description:
      "Every claim is checked against current sources and labeled confirmed, stale, or unverifiable.",
  },
];

function MockDocBox() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#1a1a1a] p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-3.5 w-3.5 text-zinc-600"
          >
            <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 10.62 4H12.5A1.5 1.5 0 0 1 14 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9Z" />
          </svg>
        </div>
        <span className="text-[11px] text-zinc-600">your_doc.pdf</span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-white/5" />
        <div className="h-1.5 w-3/4 rounded-full bg-white/5" />
        <div className="h-1.5 w-5/6 rounded-full bg-white/5" />
      </div>
    </div>
  );
}

function MockClaimChips() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#1a1a1a] px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
        <div className="h-1.5 w-24 rounded-full bg-white/5" />
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#1a1a1a] px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500/60" />
        <div className="h-1.5 w-20 rounded-full bg-white/5" />
        <span className="ml-auto text-[9px] text-blue-400/70">Checking…</span>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#1a1a1a] px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
        <div className="h-1.5 w-16 rounded-full bg-white/5" />
      </div>
    </div>
  );
}

function MockBadges() {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
        Confirmed
      </span>
      <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-400">
        Stale
      </span>
    </div>
  );
}

const mockups = [MockDocBox, MockClaimChips, MockBadges];

export default function HowItWorks() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 pt-28 pb-16">
      <div className="hero-glow" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-zinc-400">
          How it works
        </span>

        <h1 className="mt-6 text-[60px] font-bold leading-none tracking-tight text-zinc-100 sm:text-[70px]">
          3 steps to catch
          <br />
          fact rot
        </h1>

        <p className="mx-auto mt-5 max-w-[600px] text-sm leading-relaxed text-zinc-500">
          Paste a document, let AI pull out every checkable claim, and see which
          ones still hold up against the live web.
        </p>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => {
            const Mockup = mockups[i];
            return (
              <div
                key={step.number}
                className="flex flex-col rounded-2xl border border-[#262626] bg-[#141414] p-6 text-left"
              >
                <div className="flex items-start justify-between">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    {step.heading}
                  </h2>
                  <span className="text-[40px] font-bold leading-none text-white/[0.04]">
                    {step.number}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  {step.description}
                </p>

                <div className="mt-auto pt-5">
                  <Mockup />
                </div>
              </div>
            );
          })}
        </div>

        <Link
          href="/check"
          className="mt-12 inline-block rounded-full bg-zinc-100 px-7 py-3 text-sm font-medium text-zinc-900 transition hover:bg-white"
        >
          Try it now
        </Link>
      </div>
    </main>
  );
}
