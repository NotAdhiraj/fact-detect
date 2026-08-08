import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

async function parseWithPdfjs(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  // Polyfill DOMMatrix for Node.js (required by pdfjs-dist v4+)
  if (typeof globalThis.DOMMatrix === "undefined") {
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      constructor() {}
      multiply() { return new DOMMatrix(); }
      translate() { return new DOMMatrix(); }
      scale() { return new DOMMatrix(); }
      rotate() { return new DOMMatrix(); }
      toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
    };
  }

  // @ts-ignore
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdfDoc = await loadingTask.promise;

  let fullText = "";
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return { text: fullText.trim(), numPages: pdfDoc.numPages };
}

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

  // Log file info before parsing
  const headerBytes = buffer.subarray(0, 16);
  const headerHex = headerBytes.toString("hex");
  const headerAscii = headerBytes.toString("ascii").replace(/[^\x20-\x7e]/g, ".");
  console.log(`[pdf-parse] Received file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
  console.log(`[pdf-parse] Buffer length: ${buffer.length} bytes`);
  console.log(`[pdf-parse] Buffer header (first 16 bytes): hex=${headerHex} ascii="${headerAscii}"`);

  // Validate buffer
  if (buffer.length === 0) {
    console.error("[pdf-parse] Buffer is empty after conversion");
    return NextResponse.json(
      { error: "File appears to be empty" },
      { status: 422 }
    );
  }

  // Check for PDF magic bytes (warn if missing, some valid PDFs have offset)
  const pdfHeader = buffer.subarray(0, 5).toString("ascii");
  if (pdfHeader !== "%PDF-") {
    console.warn(`[pdf-parse] Warning: Buffer does not start with %PDF- header. Found: "${pdfHeader}" (${buffer.subarray(0, 5).toString("hex")})`);
  } else {
    console.log(`[pdf-parse] Valid PDF header detected: ${pdfHeader}`);
  }

  // Try pdf-parse first (fast, works for most PDFs)
  try {
    const data = await pdf(buffer);
    console.log(`[pdf-parse] Successfully parsed with pdf-parse: ${data.numpages} pages, ${data.text?.length ?? 0} characters extracted`);

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
  } catch (pdfParseError) {
    // Log pdf-parse failure, then try pdfjs-dist fallback
    console.warn("[pdf-parse] pdf-parse failed, trying pdfjs-dist fallback:");
    if (pdfParseError instanceof Error) {
      console.warn(`[pdf-parse] pdf-parse error: ${pdfParseError.name}: ${pdfParseError.message}`);
    }

    try {
      const result = await parseWithPdfjs(buffer);
      console.log(`[pdf-parse] Successfully parsed with pdfjs-dist fallback: ${result.numPages} pages, ${result.text.length} characters extracted`);

      if (result.text.trim().length === 0) {
        return NextResponse.json(
          {
            error:
              "Couldn't extract text from this PDF — it may be a scanned image. Try pasting the text directly.",
          },
          { status: 422 }
        );
      }

      if (result.numPages > 10) {
        return NextResponse.json(
          {
            error: `This PDF has ${result.numPages} pages. Please upload a document with 10 pages or fewer to keep verification fast and accurate.`,
          },
          { status: 422 }
        );
      }

      return NextResponse.json({ text: result.text });
    } catch (fallbackError) {
      // Both parsers failed — log full details
      console.error("[pdf-parse] Both pdf-parse and pdfjs-dist failed:");
      console.error("[pdf-parse] pdf-parse error:", pdfParseError);
      console.error("[pdf-parse] pdfjs-dist error:", fallbackError);

      return NextResponse.json(
        {
          error:
            "This PDF couldn't be parsed — AI-generated PDFs are not supported. Try pasting the text directly instead.",
          details: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        },
        { status: 422 }
      );
    }
  }
}
