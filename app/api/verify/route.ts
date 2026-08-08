import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/search";
import { generateContent, sanitizeError } from "@/lib/groq";
import { supabase } from "@/lib/supabase";

type FactFindingResult = {
  found_contradicting_fact: boolean;
  contradicting_fact: string | null;
  found_supporting_evidence: boolean;
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

const VERIFY_PROMPT = `You are a fact-checker. Your ONLY job is to report what the search results say about a claim. You do NOT decide whether the claim is "confirmed", "stale", or "unverifiable" — that is done by code after you respond.

For each claim, examine the search results and report your findings as structured JSON.

ENTITY MATCHING RULES:
- You may ONLY consider a search result if it is about the EXACT named entity in the claim.
- "X" is not the same as "X Pro". "Acme" is not the same as "Acme Corp".
- A result about a different entity with a similar attribute is NOT relevant to this claim.

Respond with ONLY valid JSON — no markdown fences, no preamble, no explanation.
Output format:
{
  "found_contradicting_fact": true or false,
  "contradicting_fact": "the specific correct fact found in the sources, or null if none",
  "found_supporting_evidence": true or false,
  "reasoning": "one sentence explaining what the search results contain"
}

RULES for your response:
- If you can name a specific real fact that differs from the claim (different city, number, date, name, etc.), you MUST set found_contradicting_fact to true and put that fact in contradicting_fact. This is true even if you're not 100% certain, as long as a reliable source states it clearly. A named contradicting fact IS a contradiction — do not suppress the boolean.
- found_contradicting_fact = true: search results state a DIFFERENT specific fact than what the claim asserts. Always include the contradicting_fact string with the correct fact.
- found_supporting_evidence = true: search results are clearly about the SAME entity AND directly support the claim. Do NOT set this if found_contradicting_fact is true.
- If search results contain no relevant information about this specific claim, set both to false.
- reasoning must be one sentence describing what the search results contain.`;

function buildVerifyPrompt(docTitle: string, claimText: string, resultsText: string): string {
  return `${VERIFY_PROMPT}

---

DOCUMENT CONTEXT: This claim is about "${docTitle}". Only consider search results that are clearly about this specific entity.

Claim: ${claimText}

Search results:
${resultsText}`;
}

function stripFences(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseFactFinding(raw: string): FactFindingResult {
  const jsonText = stripFences(raw);
  const parsed = JSON.parse(jsonText) as Record<string, unknown>;

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Model response was not a JSON object");
  }

  const foundContradictingFact = parsed.found_contradicting_fact === true;
  const contradictingFact =
    typeof parsed.contradicting_fact === "string" && parsed.contradicting_fact.trim().length > 0
      ? parsed.contradicting_fact.trim()
      : null;
  const foundSupportingEvidence = parsed.found_supporting_evidence === true;
  const reasoning =
    typeof parsed.reasoning === "string" && parsed.reasoning.trim().length > 0
      ? parsed.reasoning.trim()
      : "";

  return {
    found_contradicting_fact: foundContradictingFact,
    contradicting_fact: foundContradictingFact ? contradictingFact : null,
    found_supporting_evidence: foundSupportingEvidence && !foundContradictingFact,
    reasoning,
  };
}

function reconcileFinding(finding: FactFindingResult): FactFindingResult {
  // If the model named a specific contradicting fact but set the boolean to false, override it.
  // A named contradicting fact IS a contradiction regardless of what the boolean says.
  if (!finding.found_contradicting_fact && finding.contradicting_fact) {
    console.log(`[verify] Override: contradicting_fact is "${finding.contradicting_fact}" but found_contradicting_fact was false — overriding to true`);
    return {
      ...finding,
      found_contradicting_fact: true,
      found_supporting_evidence: false,
    };
  }
  return finding;
}

function computeStatus(finding: FactFindingResult): "confirmed" | "stale" | "unverifiable" {
  if (finding.found_contradicting_fact) return "stale";
  if (finding.found_supporting_evidence) return "confirmed";
  return "unverifiable";
}

function buildReasoningString(finding: FactFindingResult): string {
  if (finding.found_contradicting_fact && finding.contradicting_fact) {
    return `Sources state: ${finding.contradicting_fact}. ${finding.reasoning}`;
  }
  return finding.reasoning || "Verification produced no reasoning.";
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

  const { data: doc } = await supabase
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
    await supabase
      .from("claims")
      .update({
        status: "unverifiable",
        reasoning: "No web results found to verify this claim.",
        verified_at: now,
      })
      .eq("id", claimId);

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

  let finding: FactFindingResult | null = null;

  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const raw = await generateContent(prompt);
      finding = parseFactFinding(raw);

      // Log raw model response for debugging
      console.log(`[verify] Raw model JSON for claim ${claimId}:`, JSON.stringify(finding));

      // Reconcile: override boolean if contradicting_fact was populated
      finding = reconcileFinding(finding!);

      lastError = null;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Verification failed");
      const message = sanitizeError(lastError.message);

      if (attempt < maxAttempts && message.includes("429")) {
        const waitMatch = message.match(/try again in (\d+(?:\.\d+)?)\s*s/i);
        const waitSeconds = waitMatch ? parseFloat(waitMatch[1]) + 0.5 : 3.5;
        console.log(`[verify] Rate limited on attempt ${attempt}/${maxAttempts}, retrying in ${waitSeconds}s...`);
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

  // Deterministic status — model never decides this
  const status = computeStatus(finding!);
  const reasoning = buildReasoningString(finding!);
  const correctedFact = status === "stale" ? finding!.contradicting_fact : null;

  console.log(`[verify] Claim ${claimId}: status="${status}", contradicting=${finding!.found_contradicting_fact}, contradicting_fact="${finding!.contradicting_fact}", supporting=${finding!.found_supporting_evidence}`);

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("claims")
    .update({ status, reasoning, corrected_fact: correctedFact, verified_at: now })
    .eq("id", claimId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ claimId, status, reasoning, corrected_fact: correctedFact });
}
