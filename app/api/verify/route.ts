import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/search";
import { generateContent, sanitizeError } from "@/lib/groq";
import { supabase } from "@/lib/supabase";

type VerificationResult = {
  status: "confirmed" | "stale" | "unverifiable" | "error";
  reasoning: string;
};

type ClaimRow = {
  id: string;
  doc_id: string;
  claim_text: string;
  status: string;
  reasoning: string | null;
  verified_at: string | null;
};

const VERIFY_PROMPT = `You verify factual claims against current web search results. For each claim, classify it as one of:
- "confirmed": the claim is supported by current, authoritative sources
- "stale": the claim was once true but is now outdated or contradicted by newer sources
- "unverifiable": the search results don't contain enough information to confirm or deny the claim

CRITICAL RULE: You may ONLY confirm a claim if the search results are specifically about the SAME named entity mentioned in the claim. A search result about a different product, company, or person with a similar attribute does NOT confirm the claim. For example, if the claim is about "CloudSync Pro", a result about "Google Drive" offering 2TB storage does NOT confirm it — that is a different entity entirely.

Do not confirm a claim based on a different entity having a similar attribute. Check that the source is specifically about the entity named in the claim before confirming. If the search results only discuss other entities with similar features, the claim is "unverifiable".

Respond with ONLY valid JSON — no markdown fences, no preamble, no explanation.
Output format: {"status": "<confirmed|stale|unverifiable>", "reasoning": "<one sentence citing what the search found>"}`;

function stripFences(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseVerification(raw: string): VerificationResult {
  const jsonText = stripFences(raw);
  return JSON.parse(jsonText) as VerificationResult;
}

export async function POST(request: NextRequest) {
  let claimId: string;

  try {
    const body = await request.json();
    claimId = body.claimId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!claimId || typeof claimId !== "string") {
    return NextResponse.json({ error: "claimId is required" }, { status: 400 });
  }

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, doc_id, claim_text, status, reasoning, verified_at")
    .eq("id", claimId)
    .single();

  if (claimError || !claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  let searchResults;
  try {
    searchResults = await search(claim.claim_text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    console.error(`[verify] Search failed: ${message}`);
    const now = new Date().toISOString();
    await supabase
      .from("claims")
      .update({ status: "error", reasoning: message, verified_at: now })
      .eq("id", claimId);
    return NextResponse.json({ claimId, status: "error", reasoning: message });
  }

  if (!searchResults.results || searchResults.results.length === 0) {
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("claims")
      .update({
        status: "unverifiable",
        reasoning: "No web results found to verify this claim.",
        verified_at: now,
      })
      .eq("id", claimId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      claimId,
      status: "unverifiable",
      reasoning: "No web results found to verify this claim.",
    });
  }

  const resultsText = searchResults.results
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.content}`)
    .join("\n\n");

  const prompt = `${VERIFY_PROMPT}\n\n---\n\nClaim: ${claim.claim_text}\n\nSearch results:\n${resultsText}`;

  let raw: string;
  let result: VerificationResult;

  try {
    raw = await generateContent(prompt);
    result = parseVerification(raw);
  } catch (error) {
    const message =
      error instanceof Error
        ? sanitizeError(error.message)
        : "Verification failed";
    console.error(`[verify] LLM call failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const validStatuses = ["confirmed", "stale", "unverifiable"] as const;
  const status =
    typeof result?.status === "string" &&
    validStatuses.includes(result.status as (typeof validStatuses)[number])
      ? result.status
      : "unverifiable";

  const reasoning =
    typeof result?.reasoning === "string" && result.reasoning.trim().length > 0
      ? result.reasoning.trim()
      : "Verification produced an unreadable response.";

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("claims")
    .update({
      status,
      reasoning,
      verified_at: now,
    })
    .eq("id", claimId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ claimId, status, reasoning });
}
