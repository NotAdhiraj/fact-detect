import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DocView from "./DocView";

type DocPageProps = {
  params: { id: string };
};

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
    .select("id, doc_id, claim_text, status, reasoning, verified_at, corrected_fact")
    .eq("doc_id", doc.id)
    .order("created_at", { ascending: true });

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

  const enriched = ((claims as Omit<ClaimRow, "flags">[]) ?? []).map((c) => ({
    ...c,
    flags: flagsByClaim[c.id] ?? [],
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
