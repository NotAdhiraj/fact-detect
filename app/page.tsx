import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

async function createDoc(formData: FormData) {
  "use server";

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();

  if (!title || !content) {
    throw new Error("Title and content are required.");
  }

  const { data, error } = await supabase
    .from("docs")
    .insert({ title, content })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/doc/${data.id}`);
}

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-16">
      <div className="w-full max-w-xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Fact Rot Detector
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Paste a document to check its claims for staleness.
          </p>
        </header>

        <form action={createDoc} className="space-y-4">
          <input
            name="title"
            type="text"
            placeholder="Document title"
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
          />

          <textarea
            name="content"
            placeholder="Paste your document here…"
            required
            rows={14}
            autoFocus
            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-white"
          >
            Analyze document
          </button>
        </form>
      </div>
    </main>
  );
}
