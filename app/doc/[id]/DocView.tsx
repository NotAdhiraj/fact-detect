"use client";

import { useEffect, useState, useCallback } from "react";

type Claim = {
  id: string;
  doc_id: string;
  claim_text: string;
  status: string;
  reasoning: string | null;
  verified_at: string | null;
  flag_count: number;
};

type DocViewProps = {
  docId: string;
  title: string;
  content: string;
  initialClaims: Claim[];
};

const STATUS_STYLES: Record<string, string> = {
  confirmed:
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  stale: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  unverifiable:
    "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
  pending: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  stale: "Stale",
  unverifiable: "Unverifiable",
  pending: "Checking…",
};

function FlagButton({
  claimId,
  flagCount,
  onFlagged,
}: {
  claimId: string;
  flagCount: number;
  onFlagged: (claimId: string, newCount: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, note }),
      });
      if (res.ok) {
        onFlagged(claimId, flagCount + 1);
        setNote("");
        setOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-[11px] text-zinc-600 transition hover:text-zinc-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3 w-3"
        >
          <path d="M2.85 5.5a.75.75 0 0 0-.75.75v3.5c0 .414.336.75.75.75h1.1a.75.75 0 0 1 .75.75v1.25a.375.375 0 0 0 .7 0V10.5a.75.75 0 0 1 .75-.75h2.1a.75.75 0 0 1 .75.75v1.25a.375.375 0 0 0 .7 0V10.5a.75.75 0 0 1 .75-.75h1.1a.75.75 0 0 0 .75-.75V6.25a.75.75 0 0 0-.75-.75h-1.1a.75.75 0 0 1-.75-.75V3.75a.75.75 0 0 0-1.5 0v1.75a.75.75 0 0 1-.75.75h-2.1a.75.75 0 0 1-.75-.75V3.75a.75.75 0 0 0-1.5 0v1.75a.75.75 0 0 1-.75.75H2.85Z" />
        </svg>
        Flag as wrong
      </button>
      {flagCount > 0 && (
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/10 px-1.5 text-[10px] font-medium text-red-400 border border-red-500/20">
          {flagCount}
        </span>
      )}
      {open && (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note…"
            className="w-36 rounded-lg border border-white/[0.06] bg-[#1a1a1a] px-2.5 py-1 text-[11px] text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-white/15"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:bg-white/15 disabled:opacity-50"
          >
            {submitting ? "…" : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
}

function ClaimCard({
  claim,
  onFlagged,
}: {
  claim: Claim;
  onFlagged: (claimId: string, newCount: number) => void;
}) {
  const badgeClass = STATUS_STYLES[claim.status] ?? STATUS_STYLES.pending;
  const label = STATUS_LABEL[claim.status] ?? "Pending";

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 transition-colors hover:border-white/[0.1]">
      <p className="text-sm leading-relaxed text-zinc-200">
        {claim.claim_text}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeClass}`}
        >
          {label}
        </span>
        {claim.status === "pending" && (
          <span className="skeleton-pulse h-3 w-3 rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        )}
      </div>

      {claim.reasoning && claim.status !== "pending" && (
        <p className="mt-2.5 text-xs leading-relaxed text-zinc-500">
          {claim.reasoning}
        </p>
      )}

      {claim.status !== "pending" && (
        <div className="mt-3 flex justify-end">
          <FlagButton
            claimId={claim.id}
            flagCount={claim.flag_count}
            onFlagged={onFlagged}
          />
        </div>
      )}
    </div>
  );
}

export default function DocView({
  docId,
  title,
  content,
  initialClaims,
}: DocViewProps) {
  const [claims, setClaims] = useState<Claim[]>(initialClaims);
  const [running, setRunning] = useState(false);

  const updateClaim = useCallback((claimId: string, patch: Partial<Claim>) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, ...patch } : c))
    );
  }, []);

  const handleFlagged = useCallback((claimId: string, newCount: number) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId ? { ...c, flag_count: newCount } : c
      )
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ran = { current: false };
    if (ran.current) return;
    ran.current = true;

    async function load() {
      setRunning(true);

      // Fetch the doc's claims directly from Supabase via the API
      // to get the ground-truth state (not just React props).
      let current: Claim[];
      try {
        const res = await fetch(`/api/claims?docId=${docId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch claims");
        current = data.claims;
      } catch {
        setRunning(false);
        return;
      }

      if (cancelled) return;

      // If claims exist, hydrate state from DB and check for pending ones.
      if (current.length > 0) {
        setClaims(current);

        const pending = current.filter((c) => c.status === "pending");
        if (pending.length === 0) {
          // All claims already verified — nothing to do.
          setRunning(false);
          return;
        }

        // Re-verify only the pending claims.
        for (const claim of pending) {
          if (cancelled) return;
          try {
            const res = await fetch("/api/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ claimId: claim.id }),
            });
            const data = await res.json();
            if (!res.ok)
              throw new Error(data.error ?? "Verification failed");
            if (cancelled) return;
            updateClaim(claim.id, {
              status: data.status,
              reasoning: data.reasoning,
              verified_at: new Date().toISOString(),
            });
          } catch {
            if (cancelled) return;
            updateClaim(claim.id, {
              status: "unverifiable",
              reasoning: "Verification request failed.",
              verified_at: new Date().toISOString(),
            });
          }
        }

        if (!cancelled) setRunning(false);
        return;
      }

      // No claims yet — run the full extract + verify pipeline.
      let extracted: { id: string; claim_text: string }[];
      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Extraction failed");
        extracted = data.claims;
      } catch {
        setRunning(false);
        return;
      }

      if (!Array.isArray(extracted) || extracted.length === 0) {
        setRunning(false);
        return;
      }

      const placeholders: Claim[] = extracted.map((c) => ({
        id: c.id,
        doc_id: docId,
        claim_text: c.claim_text,
        status: "pending",
        reasoning: null,
        verified_at: null,
        flag_count: 0,
      }));

      if (cancelled) return;
      setClaims(placeholders);

      for (const claim of placeholders) {
        if (cancelled) return;

        try {
          const res = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ claimId: claim.id }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Verification failed");
          if (cancelled) return;
          updateClaim(claim.id, {
            status: data.status,
            reasoning: data.reasoning,
            verified_at: new Date().toISOString(),
          });
        } catch {
          if (cancelled) return;
          updateClaim(claim.id, {
            status: "unverifiable",
            reasoning: "Verification request failed.",
            verified_at: new Date().toISOString(),
          });
        }
      }

      if (!cancelled) setRunning(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const handleRecheck = useCallback(async () => {
    setRunning(true);

    const toRecheck = claims.map((c) => c.id);
    setClaims((prev) =>
      prev.map((c) => ({ ...c, status: "pending", reasoning: null }))
    );

    for (const claimId of toRecheck) {
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claimId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Verification failed");
        updateClaim(claimId, {
          status: data.status,
          reasoning: data.reasoning,
          verified_at: new Date().toISOString(),
        });
      } catch {
        updateClaim(claimId, {
          status: "unverifiable",
          reasoning: "Verification request failed.",
          verified_at: new Date().toISOString(),
        });
      }
    }

    setRunning(false);
  }, [claims, updateClaim]);

  return (
    <main className="relative min-h-screen px-4 pt-28 pb-16">
      <div className="hero-glow" aria-hidden="true" />

      <article className="relative z-10 mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          {title}
        </h1>

        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-zinc-500">
          {content}
        </p>

        <div className="mt-12 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            Claims
          </h2>
          <button
            onClick={handleRecheck}
            disabled={running}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 transition hover:border-white/20 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? "Checking…" : "Re-check this doc"}
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {claims.length === 0 && !running && (
            <p className="text-sm text-zinc-600">No claims extracted yet.</p>
          )}
          {claims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              onFlagged={handleFlagged}
            />
          ))}
        </div>
      </article>
    </main>
  );
}
