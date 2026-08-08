"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function CheckPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"paste" | "pdf">("paste");
  const [parsingPdf, setParsingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handlePdfUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setPdfError(null);

      if (file.size > MAX_FILE_SIZE) {
        setPdfError(
          `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`
        );
        e.target.value = "";
        return;
      }

      setParsingPdf(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          setPdfError(data.error ?? "Failed to parse PDF");
          return;
        }

        setContent(data.text);

        // Auto-fill title from filename if empty
        if (!title.trim()) {
          const name = file.name.replace(/\.pdf$/i, "");
          setTitle(name);
        }
      } catch {
        setPdfError("Failed to upload PDF. Please try again.");
      } finally {
        setParsingPdf(false);
        e.target.value = "";
      }
    },
    [title]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || !content.trim() || submitting) return;

      setSubmitting(true);
      try {
        const res = await fetch("/api/docs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), content: content.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create doc");
        router.push(`/doc/${data.id}`);
      } catch {
        setSubmitting(false);
      }
    },
    [title, content, submitting, router]
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 pt-24 pb-16">
      <div className="hero-glow" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-[700px]">
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-5 shadow-2xl shadow-black/40 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Check for Fact Rot
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Paste a document and we&apos;ll extract every factual claim, verify it
            against current web sources, and flag anything that&apos;s gone stale.
          </p>

          {/* Tab toggle */}
          <div className="mt-6 flex gap-1 rounded-lg border border-white/[0.06] bg-[#1a1a1a] p-1">
            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                activeTab === "paste"
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Paste text
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pdf")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                activeTab === "pdf"
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Upload PDF
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              required
              className="w-full rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-white/15 focus:ring-1 focus:ring-white/10"
            />

            {activeTab === "paste" ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your document, README, or doc URL here"
                required
                rows={12}
                className="w-full resize-none rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-4 py-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-white/15 focus:ring-1 focus:ring-white/10"
              />
            ) : (
              <div className="space-y-3">
                <div
                  onClick={() => !parsingPdf && fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 transition ${
                    parsingPdf
                      ? "border-blue-500/30 bg-blue-500/5 cursor-wait"
                      : "border-white/[0.08] bg-[#1a1a1a] hover:border-white/[0.15] cursor-pointer"
                  }`}
                >
                  {parsingPdf ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                      <span className="text-sm text-blue-400">
                        Parsing PDF…
                      </span>
                    </>
                  ) : content ? (
                    <>
                      <svg
                        className="h-8 w-8 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm text-zinc-400">
                        PDF parsed — {content.length.toLocaleString()} characters
                        extracted
                      </span>
                      <span className="text-xs text-zinc-600">
                        Click to upload a different PDF
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-8 w-8 text-zinc-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                      <span className="text-sm text-zinc-400">
                        Click to upload a PDF
                      </span>
                      <span className="text-xs text-zinc-600">
                        Max 10MB — text will be extracted automatically
                      </span>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />

                {pdfError && (
                  <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {pdfError}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="w-full rounded-full bg-zinc-100 px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {submitting ? "Creating…" : "Check for Fact Rot"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
