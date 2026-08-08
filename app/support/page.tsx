"use client";

import { useState, useRef, useEffect } from "react";

const faqs = [
  {
    q: "What counts as a checkable claim?",
    a: "Any specific, verifiable statement — version numbers, dates, pricing, feature claims, or 'X supports Y' type statements. Vague opinions aren't extracted as claims.",
  },
  {
    q: "How accurate is verification?",
    a: "We cross-check every claim against live web search results in real time. If we can't find a reliable source, we mark it unverifiable rather than guessing.",
  },
  {
    q: "Is my document data stored?",
    a: "Yes, documents are stored so you can share a link and revisit results later. No account or personal data is required.",
  },
  {
    q: "Can I use this for my company's docs?",
    a: "Yes — the Companies flow lets you generate a shareable link anyone can use to check your doc and flag outdated claims.",
  },
  {
    q: "What does 'unverifiable' mean?",
    a: "It means we couldn't find enough current, reliable information to confirm or deny the claim — not that it's necessarily wrong.",
  },
];

function AccordionItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium text-zinc-100">{faq.q}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
        >
          <path
            fillRule="evenodd"
            d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-[height] duration-200 ease-in-out"
        style={{ height }}
      >
        <div ref={contentRef} className="pb-4">
          <p className="text-xs leading-relaxed text-zinc-500">{faq.a}</p>
        </div>
      </div>
      <div className="border-t border-[#262626]" />
    </div>
  );
}

export default function Support() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 pt-28 pb-16">
      <div className="hero-glow" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        {/* Top section */}
        <div className="text-center">
          <h1 className="text-[50px] font-bold leading-none tracking-tight text-zinc-100 sm:text-[60px]">
            How can we help you?
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-sm leading-relaxed text-zinc-500">
            Everything you need to know about checking documents, verifying
            claims, and sharing results with your team.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="mt-16 flex flex-col gap-10 sm:flex-row">
          {/* Left column */}
          <div className="sm:w-[30%] sm:shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Support
            </p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-100">FAQs</h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Quick answers to common questions about how Fact Rot Detector
              works and what happens to your documents.
            </p>
          </div>

          {/* Right column — FAQ list */}
          <div className="sm:w-[70%]">
            <div className="border-t border-[#262626]">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  faq={faq}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Contact footer */}
        <p className="mt-16 text-center text-xs text-zinc-600">
          Still have questions? Reach out at{" "}
          <a
            href="mailto:adhirajsingh908@gmail.com"
            className="text-zinc-400 underline underline-offset-2 transition hover:text-zinc-200"
          >
            adhirajsingh908@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}
