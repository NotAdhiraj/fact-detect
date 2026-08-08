import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let claimId: string;
  let note: string;

  try {
    const body = await request.json();
    claimId = body.claimId;
    note = body.note ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!claimId || typeof claimId !== "string") {
    return NextResponse.json({ error: "claimId is required" }, { status: 400 });
  }

  if (typeof note !== "string") {
    return NextResponse.json({ error: "note must be a string" }, { status: 400 });
  }

  const { error } = await supabase
    .from("flags")
    .insert({ claim_id: claimId, note });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
