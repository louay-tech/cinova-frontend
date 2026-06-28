// Client-only PDF text extraction using pdfjs-dist.
// Extracts pages in batches of 10, yielding to the event loop between batches,
// and supports cancellation via AbortSignal.
import type { Novel } from "./novels";
import { saveUploadedNovel } from "./uploadedNovels";

export class PdfExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfExtractionError";
  }
}

export class PdfCancelledError extends Error {
  constructor() {
    super("Cancelled");
    this.name = "PdfCancelledError";
  }
}

const FRIENDLY_ERROR =
  "Could not read this PDF. It may be scanned or image-based. Please try a text-based PDF.";

export type PdfProgress = {
  loadedPages: number;
  totalPages: number;
};

export type ExtractOptions = {
  onProgress?: (p: PdfProgress) => void;
  signal?: AbortSignal;
};

const BATCH_SIZE = 10;

function checkCancel(signal?: AbortSignal) {
  if (signal?.aborted) throw new PdfCancelledError();
}

export async function extractNovelFromPdf(
  file: File,
  opts: ExtractOptions = {},
): Promise<Novel> {
  const { onProgress, signal } = opts;

  let pdfjs: typeof import("pdfjs-dist");
  try {
    pdfjs = await import("pdfjs-dist");
    const workerMod = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = (workerMod as { default: string }).default;
  } catch (err) {
    console.error("Failed to load pdfjs", err);
    throw new PdfExtractionError(FRIENDLY_ERROR);
  }

  checkCancel(signal);

  let pdf;
  try {
    const buf = await file.arrayBuffer();
    checkCancel(signal);
    pdf = await pdfjs.getDocument({
      data: buf,
      useSystemFonts: true,
      disableFontFace: false,
    }).promise;
  } catch (err) {
    if (err instanceof PdfCancelledError) throw err;
    console.error("Failed to open PDF", err);
    throw new PdfExtractionError(FRIENDLY_ERROR);
  }

  const total = pdf.numPages;
  const pageTexts: string[] = [];
  onProgress?.({ loadedPages: 0, totalPages: total });

  for (let start = 1; start <= total; start += BATCH_SIZE) {
    checkCancel(signal);
    const end = Math.min(start + BATCH_SIZE - 1, total);
    for (let i = start; i <= end; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent({
          includeMarkedContent: false,
          disableNormalization: false,
        } as Parameters<typeof page.getTextContent>[0]);
        const text = (content.items as Array<{ str?: string }>)
          .map((it) => (typeof it.str === "string" ? it.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (text) pageTexts.push(text);
        // Release page resources promptly to keep memory low.
        page.cleanup();
      } catch (err) {
        console.warn(`Failed to read page ${i}`, err);
      }
      checkCancel(signal);
    }
    onProgress?.({ loadedPages: end, totalPages: total });
    // Yield to the event loop so the UI stays responsive between batches.
    await new Promise((r) => setTimeout(r, 0));
  }

  const totalChars = pageTexts.join(" ").length;
  if (totalChars < 100) {
    throw new PdfExtractionError(FRIENDLY_ERROR);
  }

  const chapters = pageTexts.map((pageText, idx) => {
    const sentences = pageText.match(/[^.!?]+[.!?]+(\s|$)/g) || [pageText];
    const paragraphs: string[] = [];
    const chunkSize = 3;
    for (let i = 0; i < sentences.length; i += chunkSize) {
      paragraphs.push(sentences.slice(i, i + chunkSize).join(" ").trim());
    }
    return {
      title: `Page ${idx + 1}`,
      paragraphs: paragraphs.length ? paragraphs : [pageText],
    };
  });

  const baseName = file.name.replace(/\.pdf$/i, "");
  const id = `uploaded-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const novel: Novel = {
    id,
    title: baseName,
    author: "Uploaded PDF",
    year: new Date().getFullYear().toString(),
    tagline: "A document from your library.",
    coverGradient: "linear-gradient(135deg, oklch(0.3 0.06 250), oklch(0.2 0.04 30))",
    chapters: chapters.length ? chapters : [{ title: "Document", paragraphs: ["(empty)"] }],
  };

  saveUploadedNovel(novel);
  (novel as Novel & { _charCount?: number })._charCount = totalChars;
  return novel;
}
