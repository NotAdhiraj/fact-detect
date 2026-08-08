import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are accepted" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const data = await pdf(buffer);

    if (data.numpages > 10) {
      return NextResponse.json(
        {
          error: `This PDF has ${data.numpages} pages. Please upload a document with 10 pages or fewer to keep verification fast and accurate.`,
        },
        { status: 422 }
      );
    }

    if (!data.text || data.text.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Couldn't extract text from this PDF — it may be a scanned image. Try pasting the text directly.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: data.text });
  } catch (e) {
    console.error("PDF parse error:", e);
    return NextResponse.json(
      {
        error:
          "Couldn't parse this PDF — it may be corrupted. Try pasting the text directly.",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 422 }
    );
  }
}
