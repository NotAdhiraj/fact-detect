"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  { num: 1, label: "Your Doc" },
  { num: 2, label: "Doc Details" },
  { num: 3, label: "Get Your Link" },
];

export default function CompaniesPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canNext =
    (step === 1 && title.trim().length > 0 && content.trim().length > 0) ||
    (step === 2 && title.trim().length > 0);

  const handleCreate = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create doc");
      setDocId(data.id);
      setStep(3);
    } catch {
      setSubmitting(false);
    }
  }, [title, content]);

  const handleNext = () => {
    if (step === 2) {
      handleCreate();
    } else if (step < 3) {
      setStep(step + 1);
    }
  };

  const shareUrl = docId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/doc/${docId}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 pt-24 pb-16">
      <div className="hero-glow" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-[700px]">
        {/* Stepper — compact on mobile */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile: text-based stepper */}
          <div className="flex items-center justify-center gap-2 sm:hidden">
            <span className="text-xs text-zinc-500">Step {step} of 3</span>
            <span className="text-zinc-700">—</span>
            <span className="text-xs font-medium text-zinc-300">
              {STEPS[step - 1].label}
            </span>
          </div>

          {/* Desktop: full stepper */}
          <div className="hidden items-center justify-center gap-2 sm:flex">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    step === s.num
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : step > s.num
                        ? "bg-white/10 text-zinc-300"
                        : "bg-white/5 text-zinc-600"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                      step === s.num
                        ? "bg-white/20"
                        : step > s.num
                          ? "bg-white/10"
                          : "bg-white/5"
                    }`}
                  >
                    {step > s.num ? "✓" : s.num}
                  </span>
                  {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-px w-8 ${
                      step > s.num ? "bg-white/20" : "bg-white/5"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-5 shadow-2xl shadow-black/40 transition-all duration-200 hover:border-white/20 sm:p-8">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
                Paste your document
              </h2>
              <p className="text-sm text-zinc-500">
                We&apos;ll extract factual claims and set up continuous monitoring.
              </p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                className="w-full rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-white/15 focus:ring-1 focus:ring-white/10"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your document, README, or doc URL here"
                rows={12}
                className="w-full resize-none rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-4 py-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-white/15 focus:ring-1 focus:ring-white/10"
              />
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
                Doc details
              </h2>
              <p className="text-sm text-zinc-500">
                Add metadata so your team can find and organize docs later.
              </p>
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  Document name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-white/15 focus:ring-1 focus:ring-white/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  Category{" "}
                  <span className="text-zinc-700">(optional)</span>
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. API Docs, Legal, Product"
                  className="w-full rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-white/15 focus:ring-1 focus:ring-white/10"
                />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
                Your shareable link
              </h2>
              <p className="text-sm text-zinc-500">
                Anyone with this link can check the document and flag outdated
                claims.
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-4 py-3">
                <span className="flex-1 truncate text-sm text-zinc-300">
                  {shareUrl}
                </span>
                <button
                  onClick={copyLink}
                  className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-all duration-200 hover:bg-white/15 hover:scale-[1.02]"
                >
                  Copy link
                </button>
              </div>
              <p className="text-xs text-zinc-600">
                Share this with your team. They can review claims, flag
                inaccuracies, and see verification status at a glance.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 && step < 3 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="text-xs text-zinc-500 transition hover:text-zinc-300"
              >
                Back
              </button>
            ) : step === 3 ? (
              <button
                onClick={() => router.push(`/doc/${docId}`)}
                className="text-xs text-zinc-500 transition hover:text-zinc-300"
              >
                View document
              </button>
            ) : (
              <span />
            )}

            {step < 3 && (
              <button
                onClick={handleNext}
                disabled={!canNext || submitting}
                className="rounded-full bg-zinc-100 px-6 py-3 text-sm font-medium text-zinc-900 transition-all duration-200 hover:bg-white hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                {submitting
                  ? "Creating…"
                  : step === 2
                    ? "Create & Generate Link"
                    : "Next Step"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
