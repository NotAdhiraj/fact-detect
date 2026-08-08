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
  confirmed: "bg-green-500/15 text-green-400 border-green-500/25",
  stale: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  unverifiable: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
  pending: "bg-blue-500/15 text-blue-400 border-blue-500/25",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  stale: "Stale",
  unverifiable: "Unverifiable",
  pending: "Pending",
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
        className="inline-flex items-center gap-1 text-xs text-zinc-600 transition hover:text-zinc-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path d="M2.85 5.5a.75.75 0 0 0-.75.75v3.5c0 .414.336.75.75.75h1.1a.75.75 0 0 1 .75.75v1.25a.375.375 0 0 0 .7 0V10.5a.75.75 0 0 1 .75-.75h2.1a.75.75 0 0 1 .75.75v1.25a.375.375 0 0 0 .7 0V10.5a.75.75 0 0 1 .75-.75h1.1a.75.75 0 0 0 .75-.75V6.25a.75.75 0 0 0-.75-.75h-1.1a.75.75 0 0 1-.75-.75V3.75a.75.75 0 0 0-1.5 0v1.75a.75.75 0 0 1-.75.75h-2.1a.75.75 0 0 1-.75-.75V3.75a.75.75 0 0 0-1.5 0v1.75a.75.75 0 0 1-.75.75H2.85Z" />
        </svg>
        Flag
      </button>
      {flagCount > 0 && (
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/15 px-1.5 text-[10px] font-medium text-red-400 border border-red-500/25">
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
            className="w-36 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-zinc-500"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-600 disabled:opacity-50"
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-sm leading-relaxed text-zinc-100">{claim.claim_text}</p>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass}`}
        >
          {label}
        </span>
        {claim.status === "pending" && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        )}
      </div>

      {claim.reasoning && claim.status !== "pending" && (
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          {claim.reasoning}
        </p>
      )}

      {claim.status !== "pending" && (
        <div className="mt-3">
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
    if (initialClaims.length > 0) return;

    let cancelled = false;

    async function extractAndVerify() {
      setRunning(true);

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

    extractAndVerify();
    return () => {
      cancelled = true;
    };
  }, [docId, initialClaims.length, updateClaim]);

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
    <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

        <p className="mt-8 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
          {content}
        </p>

        <div className="mt-12 flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight">Claims</h2>
          <button
            onClick={handleRecheck}
            disabled={running}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Checking…" : "Re-check this doc"}
          </button>
        </div>

        <div className="mt-4 space-y-3">
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
