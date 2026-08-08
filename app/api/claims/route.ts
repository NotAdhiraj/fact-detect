import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type FlagData = {
  id: string;
  note: string;
  created_at: string;
};

type ClaimRow = {
  id: string;
  doc_id: string;
  claim_text: string;
  status: string;
  reasoning: string | null;
  verified_at: string | null;
  corrected_fact: string | null;
  flags: FlagData[];
};

export async function GET(request: NextRequest) {
  const docId = request.nextUrl.searchParams.get("docId");

  if (!docId || typeof docId !== "string") {
    return NextResponse.json({ error: "docId is required" }, { status: 400 });
  }

  const { data: claims, error: claimsError } = await supabase
    .from("claims")
    .select("id, doc_id, claim_text, status, reasoning, verified_at, corrected_fact")
    .eq("doc_id", docId);

  if (claimsError) {
    return NextResponse.json({ error: claimsError.message }, { status: 500 });
  }

  const claimIds = (claims ?? []).map((c) => c.id);

  const flagsByClaim: Record<string, FlagData[]> = {};
  if (claimIds.length > 0) {
    const { data: flags } = await supabase
      .from("flags")
      .select("id, claim_id, note, created_at")
      .in("claim_id", claimIds)
      .order("created_at", { ascending: true });

    for (const f of flags ?? []) {
      if (!flagsByClaim[f.claim_id]) flagsByClaim[f.claim_id] = [];
      flagsByClaim[f.claim_id].push({
        id: f.id,
        note: f.note,
        created_at: f.created_at,
      });
    }
  }

  const enriched: ClaimRow[] = ((claims ?? []) as Omit<ClaimRow, "flags">[]).map(
    (c) => ({
      ...c,
      flags: flagsByClaim[c.id] ?? [],
    })
  );

  return NextResponse.json({ claims: enriched });
}
