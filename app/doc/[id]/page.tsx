import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DocView from "./DocView";

type DocPageProps = {
  params: { id: string };
};

type ClaimRow = {
  id: string;
  doc_id: string;
  claim_text: string;
  status: string;
  reasoning: string | null;
  verified_at: string | null;
  flag_count: number;
};

export default async function DocPage({ params }: DocPageProps) {
  const { data: doc, error } = await supabase
    .from("docs")
    .select("id, title, content, created_at")
    .eq("id", params.id)
    .single();

  if (error || !doc) {
    notFound();
  }

  const { data: claims } = await supabase
    .from("claims")
    .select("id, doc_id, claim_text, status, reasoning, verified_at")
    .eq("doc_id", doc.id)
    .order("created_at", { ascending: true });

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

  const enriched = ((claims as ClaimRow[]) ?? []).map((c) => ({
    ...c,
    flag_count: flagCounts[c.id] ?? 0,
  }));

  return (
    <DocView
      docId={doc.id}
      title={doc.title}
      content={doc.content}
      initialClaims={enriched}
    />
  );
}
