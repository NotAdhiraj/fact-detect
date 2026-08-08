import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let title: string;
  let content: string;

  try {
    const body = await request.json();
    title = body.title;
    content = body.content;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("docs")
    .insert({ title: title.trim(), content: content.trim() })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
