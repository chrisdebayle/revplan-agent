import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file in request." }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (ext === "pdf") {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      // Strip pdf-parse's "-- N of M --" page-break markers — noise for an
      // LLM prompt, not a claim worth preserving.
      const text = result.text.replace(/^-- \d+ of \d+ --$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
      return NextResponse.json({ text });
    }
    if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      return NextResponse.json({ text: result.value });
    }
    // Legacy .doc (pre-2007 binary format) isn't supported by mammoth, which
    // only reads the OOXML .docx format.
    return NextResponse.json(
      { error: `.${ext} isn't parsed by this build — only .pdf and .docx go through the server parser.` },
      { status: 415 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "File parsing failed." },
      { status: 500 }
    );
  }
}
