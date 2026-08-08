import { NextRequest, NextResponse } from "next/server";
import {
  generateContent,
  generateContentWithHistory,
  sanitizeError,
} from "@/lib/groq";
import { supabase } from "@/lib/supabase";

type ExtractedClaim = {
  claim_text: string;
};

type ClaimRow = {
  id: string;
  doc_id: string;
  claim_text: string;
  status: string;
  reasoning: string | null;
  verified_at: string | null;
};

const SYSTEM_PROMPT = `You extract discrete, independently verifiable factual claims from documents.
Focus on concrete facts such as version numbers, dates, pricing, compatibility statements ("X supports Y"), API endpoints, statistics, and named specifications.
Skip opinions, vague marketing language, and claims that cannot be checked against external sources.
Respond with ONLY valid JSON — no markdown fences, no preamble, no explanation.
Output format: an array of objects, each with a single "claim_text" string field.`;

const RETRY_INSTRUCTION =
  "Reminder: respond with ONLY the JSON array. No markdown fences, no explanation, no text before or after.";

function stripFences(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseClaims(raw: string): ExtractedClaim[] {
  const jsonText = stripFences(raw);
  const parsed: unknown = JSON.parse(jsonText);

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Model response was not a JSON array. Raw output: ${raw.slice(0, 500)}`
    );
  }

  return parsed.filter(
    (item): item is ExtractedClaim =>
      typeof item?.claim_text === "string" && item.claim_text.trim().length > 0
  );
}

export async function POST(request: NextRequest) {
  let docId: string;

  try {
    const body = await request.json();
    docId = body.docId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!docId || typeof docId !== "string") {
    return NextResponse.json({ error: "docId is required" }, { status: 400 });
  }

  const { data: doc, error: docError } = await supabase
    .from("docs")
    .select("id, title, content")
    .eq("id", docId)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const prompt = `${SYSTEM_PROMPT}\n\n---\n\n${doc.content}`;

  let raw: string;
  let extracted: ExtractedClaim[];

  try {
    raw = await generateContent(prompt);
    extracted = parseClaims(raw);
  } catch (error) {
    const msg =
      error instanceof Error ? sanitizeError(error.message) : String(error);
    console.error(`[extract] First attempt failed: ${msg}`);
    return NextResponse.json(
      { error: `Extraction failed: ${msg}` },
      { status: 500 }
    );
  }

  // Retry once if parsing failed or returned zero claims
  if (extracted.length === 0) {
    console.log(
      "[extract] Zero claims from first attempt — retrying with stricter instruction"
    );

    try {
      raw = await generateContentWithHistory([
        { role: "user", parts: doc.content },
        { role: "model", parts: raw },
        { role: "user", parts: RETRY_INSTRUCTION },
      ]);
      extracted = parseClaims(raw);
    } catch (error) {
      const msg =
        error instanceof Error ? sanitizeError(error.message) : String(error);
      console.error(`[extract] Retry failed: ${msg}`);
      return NextResponse.json(
        { error: `Extraction failed after retry: ${msg}` },
        { status: 500 }
      );
    }

    if (extracted.length === 0) {
      console.error(
        `[extract] Retry returned zero claims. Raw output: ${raw.slice(0, 500)}`
      );
      return NextResponse.json(
        {
          error:
            "Model returned zero claims after retry. Raw output included for debugging.",
          rawOutput: raw,
        },
        { status: 500 }
      );
    }
  }

  console.log(`[extract] Extracted ${extracted.length} claims`);

  const claimsToInsert = extracted.map((item) => ({
    doc_id: docId,
    claim_text: item.claim_text.trim(),
    status: "pending" as const,
  }));

  const { data: claims, error: insertError } = await supabase
    .from("claims")
    .insert(claimsToInsert)
    .select("id, doc_id, claim_text, status, reasoning, verified_at");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ claims: claims as ClaimRow[] });
}
