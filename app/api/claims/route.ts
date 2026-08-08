import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type ClaimRow = {
  id: string;
  doc_id: string;
  claim_text: string;
  status: string;
  reasoning: string | null;
  verified_at: string | null;
  flag_count: number;
};

export async function GET(request: NextRequest) {
  const docId = request.nextUrl.searchParams.get("docId");

  if (!docId || typeof docId !== "string") {
    return NextResponse.json({ error: "docId is required" }, { status: 400 });
  }

  const { data: claims, error: claimsError } = await supabase
    .from("claims")
    .select("id, doc_id, claim_text, status, reasoning, verified_at")
    .eq("doc_id", docId);

  if (claimsError) {
    return NextResponse.json({ error: claimsError.message }, { status: 500 });
  }

  const claimIds = (claims ?? []).map((c) => c.id);

  let flagCounts: Record<string, number> = {};
  if (claimIds.length > 0) {
    const { data: flags } = await supabase
      .from("flags")
      .select("claim_id")
      .in("claim_id", claimIds);

    for (const f of flags ?? []) {
      flagCounts[f.claim_id] = (flagCounts[f.claim_id] ?? 0) + 1;
    }
  }

  const enriched: ClaimRow[] = ((claims as Omit<ClaimRow, "flag_count">[]) ?? []).map(
    (c) => ({
      ...c,
      flag_count: flagCounts[c.id] ?? 0,
    })
  );

  return NextResponse.json({ claims: enriched });
}
