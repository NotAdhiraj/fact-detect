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

CRITICAL RULES FOR ENTITY MATCHING:
1. You may ONLY confirm a claim if the search results are specifically about the EXACT named entity mentioned in the claim — the full, complete name.
2. If the claim names a specific product/company (e.g. "CloudSync Pro"), a source about a similarly-named but different product (e.g. just "CloudSync" without "Pro") does NOT count as confirmation — mark as unverifiable unless the source clearly refers to the exact same named entity.
3. A search result about a different product, company, or person with a similar attribute does NOT confirm the claim. For example, if the claim is about "CloudSync Pro", a result about "Google Drive" offering 2TB storage does NOT confirm it — that is a different entity entirely.
4. Partial name matches are NOT sufficient. "X" is not the same as "X Pro". "Acme" is not the same as "Acme Corp". The source must reference the exact full entity name.

Do not confirm a claim based on a different entity having a similar attribute or a partial name match. Check that the source specifically names the exact entity in the claim before confirming. If the search results only discuss other entities or use a different/shorter name, the claim is "unverifiable".

Respond with ONLY valid JSON — no markdown fences, no preamble, no explanation.
Output format: {"status": "<confirmed|stale|unverifiable>", "reasoning": "<one sentence citing what the search found>"}`;

function buildVerifyPrompt(docTitle: string, claimText: string, resultsText: string): string {
  return `${VERIFY_PROMPT}

---

DOCUMENT CONTEXT: This claim is about "${docTitle}". Only confirm using search results that are clearly about this specific entity — not a similarly-named or generic product/plan from a different company, even if the claim doesn't repeat the full name.

Claim: ${claimText}

Search results:
${resultsText}`;
}

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

  // Fetch the document title for entity context
  const { data: doc, error: docError } = await supabase
    .from("docs")
    .select("title")
    .eq("id", claim.doc_id)
    .single();

  const docTitle = doc?.title ?? "Unknown document";

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

  const prompt = buildVerifyPrompt(docTitle, claim.claim_text, resultsText);

  let result: VerificationResult = { status: "unverifiable", reasoning: "" };

  const maxAttempts = 3; // Allow up to 2 retries (3 total attempts)
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const raw = await generateContent(prompt);
      result = parseVerification(raw);
      lastError = null;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Verification failed");
      const message = sanitizeError(lastError.message);

      // Check for 429 rate limit error
      if (attempt < maxAttempts && message.includes("429")) {
        // Parse wait time from error message: "Please try again in Xs"
        const waitMatch = message.match(/try again in (\d+(?:\.\d+)?)\s*s/i);
        const waitSeconds = waitMatch ? parseFloat(waitMatch[1]) + 0.5 : 3.5;
        console.log(`[verify] Rate limited on attempt ${attempt}/${maxAttempts}, retrying in ${waitSeconds}s...`);
        console.log(`[verify] Raw error for debugging: ${message.substring(0, 200)}`);
        await new Promise((r) => setTimeout(r, waitSeconds * 1000));
        continue;
      }

      console.error(`[verify] LLM call failed on attempt ${attempt}/${maxAttempts}: ${message}`);
      const now = new Date().toISOString();
      await supabase
        .from("claims")
        .update({ status: "error", reasoning: message, verified_at: now })
        .eq("id", claimId);
      return NextResponse.json({ claimId, status: "error", reasoning: message });
    }
  }

  if (lastError) {
    const message = sanitizeError(lastError.message);
    console.error(`[verify] LLM call failed after ${maxAttempts} attempts: ${message}`);
    const now = new Date().toISOString();
    await supabase
      .from("claims")
      .update({ status: "error", reasoning: message, verified_at: now })
      .eq("id", claimId);
    return NextResponse.json({ claimId, status: "error", reasoning: message });
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
