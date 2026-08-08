"use client";

import { useEffect, useState, useCallback } from "react";

type FlagData = {
  id: string;
  note: string;
  created_at: string;
};

type Claim = {
  id: string;
  doc_id: string;
  claim_text: string;
  status: string;
  reasoning: string | null;
  verified_at: string | null;
  corrected_fact: string | null;
  flags: FlagData[];
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
  error: "bg-red-500/10 text-red-400 border border-red-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  stale: "Stale",
  unverifiable: "Unverifiable",
  pending: "Checking…",
  error: "Error",
};

function formatFlagTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function FlagButton({
  claimId,
  flags,
  onFlagged,
}: {
  claimId: string;
  flags: FlagData[];
  onFlagged: (claimId: string, newFlags: FlagData[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(false);
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
        const newFlag: FlagData = {
          id: crypto.randomUUID(),
          note: note.trim(),
          created_at: new Date().toISOString(),
        };
        onFlagged(claimId, [...flags, newFlag]);
        setNote("");
        setShowForm(false);
        setShowList(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const flagCount = flags.length;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showList) setShowList(false);
          }}
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
          <button
            onClick={() => {
              setShowList(!showList);
              if (showForm) setShowForm(false);
            }}
            className="inline-flex h-5 min-w-[20px] cursor-pointer items-center justify-center rounded-full bg-red-500/10 px-1.5 text-[10px] font-medium text-red-400 border border-red-500/20 transition-colors hover:bg-red-500/20"
          >
            {flagCount} {flagCount === 1 ? "flag" : "flags"}
          </button>
        )}
      </div>

      {showForm && (
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
            className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-all duration-200 hover:bg-white/15 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? "…" : "Submit"}
          </button>
        </div>
      )}

      {showList && flagCount > 0 && (
        <div className="w-full space-y-1.5 rounded-lg border border-white/[0.06] bg-[#0e0e0e] p-2.5">
          {flags.map((f) => (
            <div key={f.id} className="flex items-start justify-between gap-2">
              <span className="text-[11px] leading-relaxed text-zinc-400">
                {f.note || "Flagged as incorrect"}
              </span>
              <span className="shrink-0 text-[10px] text-zinc-600">
                {formatFlagTime(f.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClaimCard({
  claim,
  onFlagged,
  onRetry,
}: {
  claim: Claim;
  onFlagged: (claimId: string, newFlags: FlagData[]) => void;
  onRetry: (claimId: string) => void;
}) {
  const badgeClass = STATUS_STYLES[claim.status] ?? STATUS_STYLES.pending;
  const label = STATUS_LABEL[claim.status] ?? "Pending";

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
      <p className="text-sm leading-relaxed text-zinc-200">
        {claim.claim_text}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeClass}`}
        >
          {label}
        </span>
        {claim.status === "pending" && (
          <span className="skeleton-pulse h-3 w-3 rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        )}
        {claim.status === "error" && (
          <button
            onClick={() => onRetry(claim.id)}
            className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-400 border border-red-500/20 transition-all duration-200 hover:bg-red-500/20 hover:scale-[1.02]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
              <path fillRule="evenodd" d="M13.5 8a.75.75 0 0 1-.75.75H8.75v4a.75.75 0 0 1-1.5 0v-4H4a.75.75 0 0 1 0-1.5h3.25V4a.75.75 0 0 1 1.5 0v3.25H12.75a.75.75 0 0 1 .75.75Z" clipRule="evenodd" />
            </svg>
            Retry
          </button>
        )}
      </div>

      {claim.reasoning && claim.status !== "pending" && (
        <p className="mt-2.5 text-xs leading-relaxed text-zinc-500">
          {claim.reasoning}
        </p>
      )}

      {claim.status === "stale" && claim.corrected_fact && (
        <div className="mt-2.5 flex items-start gap-2 rounded-lg border-l-2 border-emerald-500/40 bg-emerald-500/5 pl-3 pr-2.5 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400">
            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
          </svg>
          <span className="text-xs leading-relaxed text-emerald-300/90">
            Corrected: {claim.corrected_fact}
          </span>
        </div>
      )}

      {claim.status !== "pending" && claim.status !== "error" && (
        <div className="mt-3 flex justify-end">
          <FlagButton
            claimId={claim.id}
            flags={claim.flags}
            onFlagged={onFlagged}
          />
        </div>
      )}
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeFactRotScore(claims: Claim[]): {
  score: number;
  label: string;
  color: string;
  barColor: string;
} {
  const total = claims.filter(
    (c) => c.status !== "pending" && c.status !== "error"
  ).length;
  if (total === 0)
    return { score: 0, label: "No data yet", color: "text-zinc-500", barColor: "bg-zinc-600" };

  const confirmed = claims.filter((c) => c.status === "confirmed").length;
  const unverifiable = claims.filter((c) => c.status === "unverifiable").length;

  const score = Math.round(((confirmed * 1.0 + unverifiable * 0.4) / total) * 100);

  if (score >= 80)
    return { score, label: "Looking Good", color: "text-emerald-400", barColor: "bg-emerald-400" };
  if (score >= 50)
    return { score, label: "Some Rot Detected", color: "text-amber-400", barColor: "bg-amber-400" };
  return { score, label: "Significant Rot", color: "text-red-400", barColor: "bg-red-400" };
}

function FactRotScore({ claims }: { claims: Claim[] }) {
  const { score, label, color, barColor } = computeFactRotScore(claims);

  return (
    <div className="mt-8 rounded-xl border border-white/[0.06] bg-[#111111] p-5 transition-all duration-200 hover:border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className={`text-4xl font-bold tracking-tight ${color}`}>
            {score}<span className="text-lg font-medium">%</span>
          </span>
          <span className="text-sm text-zinc-500">Fresh</span>
        </div>
        <span className={`text-xs font-medium ${color}`}>{label}</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
        <span>0%</span>
        <span>100%</span>
      </div>
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
  const [scanned, setScanned] = useState(initialClaims.length > 0);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const updateClaim = useCallback((claimId: string, patch: Partial<Claim>) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, ...patch } : c))
    );
  }, []);

  const handleFlagged = useCallback((claimId: string, newFlags: FlagData[]) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId ? { ...c, flags: newFlags } : c
      )
    );
  }, []);

  const handleRetry = useCallback(async (claimId: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId ? { ...c, status: "pending", reasoning: null, corrected_fact: null } : c
      )
    );
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? {
                ...c,
                status: data.status,
                reasoning: data.reasoning,
                corrected_fact: data.corrected_fact ?? null,
                verified_at: new Date().toISOString(),
              }
            : c
        )
      );
    } catch {
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? {
                ...c,
                status: "error",
                reasoning: "Retry failed.",
                verified_at: new Date().toISOString(),
              }
            : c
        )
      );
    }
  }, []);

  // On mount: fetch existing claims if none were passed via props (read-only).
  useEffect(() => {
    let cancelled = false;

    async function fetchExisting() {
      if (initialClaims.length > 0) return;

      let current: Claim[];
      try {
        const res = await fetch(`/api/claims?docId=${docId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch claims");
        current = data.claims;
      } catch {
        return;
      }

      if (cancelled) return;

      if (current.length > 0) {
        setClaims(current);
        setScanned(true);

        const pending = current.filter((c) => c.status === "pending");
        if (pending.length > 0) {
          setRunning(true);
          const total = pending.length;
          setProgress({ current: 0, total });
          for (let i = 0; i < pending.length; i++) {
            const claim = pending[i];
            if (cancelled) return;
            setProgress({ current: i + 1, total });
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
                corrected_fact: data.corrected_fact ?? null,
                verified_at: new Date().toISOString(),
              });
            } catch {
              if (cancelled) return;
              updateClaim(claim.id, {
                status: "error",
                reasoning: "Verification request failed.",
                verified_at: new Date().toISOString(),
              });
            }
            if (i < pending.length - 1) await delay(4500);
          }
          setProgress(null);
          setRunning(false);
        }
      }
    }

    fetchExisting();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const handleScan = useCallback(async () => {
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
      corrected_fact: null,
      flags: [],
    }));

    setClaims(placeholders);
    setScanned(true);

    const total = placeholders.length;
    setProgress({ current: 0, total });
    for (let i = 0; i < placeholders.length; i++) {
      const claim = placeholders[i];
      setProgress({ current: i + 1, total });

      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claimId: claim.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Verification failed");
        updateClaim(claim.id, {
          status: data.status,
          reasoning: data.reasoning,
          corrected_fact: data.corrected_fact ?? null,
          verified_at: new Date().toISOString(),
        });
      } catch {
        updateClaim(claim.id, {
          status: "error",
          reasoning: "Verification request failed.",
          verified_at: new Date().toISOString(),
        });
      }
      if (i < placeholders.length - 1) await delay(4500);
    }
    setProgress(null);
    setRunning(false);
  }, [docId, updateClaim]);

  const handleRecheck = useCallback(async () => {
    setRunning(true);
    const total = claims.length;
    setProgress({ current: 0, total });

    const toRecheck = claims.map((c) => c.id);
    setClaims((prev) =>
      prev.map((c) => ({ ...c, status: "pending", reasoning: null, corrected_fact: null }))
    );

    for (let i = 0; i < toRecheck.length; i++) {
      const claimId = toRecheck[i];
      setProgress({ current: i + 1, total });
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
          corrected_fact: data.corrected_fact ?? null,
          verified_at: new Date().toISOString(),
        });
      } catch {
        updateClaim(claimId, {
          status: "error",
          reasoning: "Verification request failed.",
          verified_at: new Date().toISOString(),
        });
      }
      if (i < toRecheck.length - 1) await delay(4500);
    }

    setProgress(null);
    setRunning(false);
  }, [claims, updateClaim]);

  return (
    <main className="relative min-h-screen px-4 pt-28 pb-16">
      <div className="hero-glow" aria-hidden="true" />

      <article className="relative z-10 mx-auto w-full max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          {title}
        </h1>

        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-zinc-500">
          {content}
        </p>

        {scanned ? (
          <>
            <FactRotScore claims={claims} />

            <div className="mt-12 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                Claims
              </h2>
              <div className="flex items-center gap-3">
                {progress && (
                  <span className="text-xs text-zinc-500">
                    Checking claim {progress.current} of {progress.total}…
                  </span>
                )}
                <button
                  onClick={handleRecheck}
                  disabled={running}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-white/20 hover:text-zinc-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                >
                  {running ? "Checking…" : "Re-check this doc"}
                </button>
              </div>
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
                  onRetry={handleRetry}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-16 flex flex-col items-center gap-5">
            <p className="text-sm text-zinc-500">
              This document hasn&apos;t been checked yet.
            </p>
            <button
              onClick={handleScan}
              disabled={running}
              className="rounded-full bg-zinc-100 px-6 py-3 text-sm font-medium text-zinc-900 transition-all duration-200 hover:bg-white hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              {running ? "Scanning…" : "Scan this document"}
            </button>
            {progress && (
              <span className="text-xs text-zinc-500">
                Checking claim {progress.current} of {progress.total}…
              </span>
            )}
          </div>
        )}
      </article>
    </main>
  );
}
