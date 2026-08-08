import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/openrouter";
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

  let extracted: ExtractedClaim[];

  try {
    extracted = await chatCompletion<ExtractedClaim[]>([
      {
        role: "system",
        content: `You extract discrete, independently verifiable factual claims from documents.
Focus on concrete facts such as version numbers, dates, pricing, compatibility statements ("X supports Y"), API endpoints, statistics, and named specifications.
Skip opinions, vague marketing language, and claims that cannot be checked against external sources.
Respond with ONLY valid JSON — no markdown fences, no preamble, no explanation.
Output format: an array of objects, each with a single "claim_text" string field.`,
      },
      {
        role: "user",
        content: doc.content,
      },
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract claims";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (!Array.isArray(extracted)) {
    return NextResponse.json(
      { error: "Model response was not a JSON array" },
      { status: 502 }
    );
  }

  const claimsToInsert = extracted
    .filter(
      (item): item is ExtractedClaim =>
        typeof item?.claim_text === "string" && item.claim_text.trim().length > 0
    )
    .map((item) => ({
      doc_id: docId,
      claim_text: item.claim_text.trim(),
      status: "pending" as const,
    }));

  if (claimsToInsert.length === 0) {
    return NextResponse.json({ claims: [] });
  }

  const { data: claims, error: insertError } = await supabase
    .from("claims")
    .insert(claimsToInsert)
    .select("id, doc_id, claim_text, status, reasoning, verified_at");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ claims: claims as ClaimRow[] });
}
