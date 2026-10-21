import type { PdfToolId } from "@/lib/tools/pdf-tool-config";

export interface PdfOutputFile {
  filename: string;
  blob: Blob;
}

export interface PdfResult {
  summary: string;
  files: PdfOutputFile[];
  text?: string;
  notes?: string[];
}

export type PdfOptions = Record<string, string>;
export type ProgressFn = (done: number, total: number) => void;

export interface PdfFormField {
  name: string;
  kind: "text" | "checkbox" | "dropdown" | "radio";
  value: string | boolean;
  options?: string[];
}

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export const MAX_PDF_FILES = 20;

const PT_PER_MM = 72 / 25.4;

const paperSizes: { name: string; w: number; h: number }[] = [
  { name: "A0", w: 841, h: 1189 },
  { name: "A1", w: 594, h: 841 },
  { name: "A2", w: 420, h: 594 },
  { name: "A3", w: 297, h: 420 },
  { name: "A4", w: 210, h: 297 },
  { name: "A5", w: 148, h: 210 },
  { name: "A6", w: 105, h: 148 },
  { name: "B5", w: 176, h: 250 },
  { name: "Letter", w: 215.9, h: 279.4 },
  { name: "Legal", w: 215.9, h: 355.6 },
  { name: "Tabloid", w: 279.4, h: 431.8 },
];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function baseName(file: File): string {
  return file.name.replace(/\.[^.]+$/, "") || "document";
}

function pdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

function textBlob(text: string, type: string): Blob {
  return new Blob([text], { type: `${type};charset=utf-8` });
}

/** Parses "1-3, 5, 8-" into zero-based page indexes. */
export function parsePageList(
  spec: string,
  total: number,
  options: { allowRepeat?: boolean; keepOrder?: boolean } = {},
): number[] {
  const result: number[] = [];
  const parts = spec
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) throw new Error("Enter at least one page number, for example 1-3, 5.");

  for (const part of parts) {
    const match = /^(\d+)?\s*(-)?\s*(\d+)?$/.exec(part);
    if (!match || (!match[1] && !match[3])) {
      throw new Error(`"${part}" is not a valid page or range.`);
    }
    const start = match[1] ? Number(match[1]) : 1;
    const end = match[2] ? (match[3] ? Number(match[3]) : total) : start;
    if (start < 1 || end < 1 || start > total || end > total) {
      throw new Error(`Page numbers must be between 1 and ${total}.`);
    }
    if (start > end) throw new Error(`"${part}" is a backwards range.`);
    for (let page = start; page <= end; page += 1) result.push(page - 1);
  }

  const list = options.allowRepeat ? result : [...new Set(result)];
  return options.keepOrder ? list : [...list].sort((a, b) => a - b);
}

function describeError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "";
  if (name === "PasswordException" || /encrypted|password/i.test(message)) {
    return new Error(
      "This PDF is password-protected. Remove the password in the program that created it, then try again.",
    );
  }
  if (/invalid pdf|no pdf header|failed to parse|missing pdf|InvalidPDF/i.test(`${name} ${message}`)) {
    return new Error("This file could not be read as a PDF. Try the Repair PDF tool.");
  }
  return error instanceof Error ? error : new Error(message);
}

async function loadLib() {
  return import("pdf-lib");
}

async function loadDoc(file: File, lenient = false) {
  const { PDFDocument } = await loadLib();
  try {
    return await PDFDocument.load(await file.arrayBuffer(), {
      ignoreEncryption: lenient,
      throwOnInvalidObject: !lenient,
      updateMetadata: false,
    });
  } catch (error) {
    throw describeError(error);
  }
}

async function saveDoc(doc: { save: () => Promise<Uint8Array> }): Promise<Blob> {
  return pdfBlob(await doc.save());
}

async function copyPagesInto(
  target: import("pdf-lib").PDFDocument,
  source: import("pdf-lib").PDFDocument,
  indexes: number[],
) {
  const pages = await target.copyPages(source, indexes);
  pages.forEach((page) => target.addPage(page));
}

async function openPdfJs(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    return await pdfjs.getDocument({ data }).promise;
  } catch (error) {
    throw describeError(error);
  }
}

async function extractPageTexts(file: File, onProgress?: ProgressFn): Promise<string[]> {
  const doc = await openPdfJs(file);
  const pages: string[] = [];
  try {
    for (let number = 1; number <= doc.numPages; number += 1) {
      const page = await doc.getPage(number);
      const content = await page.getTextContent();
      let text = "";
      for (const item of content.items) {
        if ("str" in item) text += item.str + (item.hasEOL ? "\n" : "");
      }
      pages.push(
        text
          .split("\n")
          .map((line) => line.replace(/[ \t]+/g, " ").trim())
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim(),
      );
      page.cleanup();
      onProgress?.(number, doc.numPages);
    }
  } finally {
    void doc.loadingTask.destroy();
  }
  return pages;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Your browser could not encode the image."))),
      type,
      quality,
    );
  });
}

async function renderPageToCanvas(
  page: import("pdfjs-dist").PDFPageProxy,
  scale: number,
): Promise<HTMLCanvasElement> {
  const base = page.getViewport({ scale: 1 });
  const maxSide = Math.max(base.width, base.height);
  const maxArea = 36_000_000;
  let safeScale = Math.min(scale, 6000 / maxSide);
  safeScale = Math.min(safeScale, Math.sqrt(maxArea / (base.width * base.height)));
  const viewport = page.getViewport({ scale: safeScale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not create a drawing surface.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas;
}

function matchPaper(widthPt: number, heightPt: number): string {
  const short = Math.min(widthPt, heightPt) / PT_PER_MM;
  const long = Math.max(widthPt, heightPt) / PT_PER_MM;
  const found = paperSizes.find(
    (size) => Math.abs(size.w - short) <= 2 && Math.abs(size.h - long) <= 2,
  );
  return found ? found.name : "Custom";
}

function describeSizes(
  sizes: { width: number; height: number; rotation: number }[],
  print: boolean,
): { text: string; summary: string } {
  const lines: string[] = [];
  const groups = new Map<string, number>();
  sizes.forEach((size, index) => {
    const mmW = size.width / PT_PER_MM;
    const mmH = size.height / PT_PER_MM;
    const paper = matchPaper(size.width, size.height);
    const orientation =
      Math.abs(size.width - size.height) < 1 ? "square" : size.width > size.height ? "landscape" : "portrait";
    const key = `${mmW.toFixed(1)} × ${mmH.toFixed(1)} mm (${paper}, ${orientation})`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
    let line =
      `Page ${index + 1}: ${size.width.toFixed(1)} × ${size.height.toFixed(1)} pt · ` +
      `${mmW.toFixed(1)} × ${mmH.toFixed(1)} mm · ${(size.width / 72).toFixed(2)} × ${(size.height / 72).toFixed(2)} in · ` +
      `${paper} ${orientation}` +
      (size.rotation ? ` · rotated ${size.rotation}°` : "");
    if (print) {
      const fits = paperSizes
        .filter((paperSize) => {
          const sheetShort = Math.min(paperSize.w, paperSize.h);
          const sheetLong = Math.max(paperSize.w, paperSize.h);
          return Math.min(mmW, mmH) <= sheetShort + 1 && Math.max(mmW, mmH) <= sheetLong + 1;
        })
        .map((paperSize) => paperSize.name);
      line += `\n    Fits without scaling on: ${fits.length ? fits.join(", ") : "larger than Tabloid"}`;
    }
    lines.push(line);
  });
  const header = [...groups.entries()]
    .map(([key, count]) => `${count} page${count === 1 ? "" : "s"}: ${key}`)
    .join("\n");
  return {
    text: `${header}\n\n${lines.join("\n")}`,
    summary: `${sizes.length} page${sizes.length === 1 ? "" : "s"} checked · ${groups.size} distinct size${groups.size === 1 ? "" : "s"}`,
  };
}

function lineSet(text: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of text.split("\n")) {
    const key = line.trim().replace(/\s+/g, " ");
    if (key) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function lineDiff(a: string, b: string): { onlyA: string[]; onlyB: string[] } {
  const mapA = lineSet(a);
  const mapB = lineSet(b);
  const onlyA: string[] = [];
  const onlyB: string[] = [];
  mapA.forEach((count, line) => {
    if ((mapB.get(line) ?? 0) < count) onlyA.push(line);
  });
  mapB.forEach((count, line) => {
    if ((mapA.get(line) ?? 0) < count) onlyB.push(line);
  });
  return { onlyA, onlyB };
}

export async function readMetadata(file: File): Promise<PdfMetadata> {
  const doc = await loadDoc(file, true);
  return {
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    keywords: doc.getKeywords() ?? "",
    creator: doc.getCreator() ?? "",
    producer: doc.getProducer() ?? "",
  };
}

export async function readFormFields(file: File): Promise<PdfFormField[]> {
  const lib = await loadLib();
  const doc = await loadDoc(file);
  const fields: PdfFormField[] = [];
  for (const field of doc.getForm().getFields()) {
    const name = field.getName();
    if (field instanceof lib.PDFTextField) {
      fields.push({ name, kind: "text", value: field.getText() ?? "" });
    } else if (field instanceof lib.PDFCheckBox) {
      fields.push({ name, kind: "checkbox", value: field.isChecked() });
    } else if (field instanceof lib.PDFDropdown) {
      fields.push({ name, kind: "dropdown", value: field.getSelected()[0] ?? "", options: field.getOptions() });
    } else if (field instanceof lib.PDFRadioGroup) {
      fields.push({ name, kind: "radio", value: field.getSelected() ?? "", options: field.getOptions() });
    }
  }
  return fields;
}

async function imageToEmbeddable(file: File): Promise<{ bytes: Uint8Array; kind: "jpg" | "png"; width: number; height: number }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`"${file.name}" is not an image your browser can read.`);
  }
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not create a drawing surface.");
  const isJpeg = file.type === "image/jpeg";
  if (isJpeg) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await canvasToBlob(canvas, isJpeg ? "image/jpeg" : "image/png", 0.95);
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    kind: isJpeg ? "jpg" : "png",
    width: canvas.width,
    height: canvas.height,
  };
}

export async function runPdfTool(
  toolId: PdfToolId,
  files: File[],
  options: PdfOptions,
  formValues: Record<string, string | boolean>,
  onProgress?: ProgressFn,
): Promise<PdfResult> {
  const first = files[0];
  if (!first) throw new Error("Choose a file first.");
  const name = baseName(first);

  switch (toolId) {
    case "merge-pdf": {
      if (files.length < 2) throw new Error("Add at least two PDF files to merge.");
      const { PDFDocument } = await loadLib();
      const merged = await PDFDocument.create();
      let count = 0;
      for (const [index, file] of files.entries()) {
        const source = await loadDoc(file);
        await copyPagesInto(merged, source, source.getPageIndices());
        count += source.getPageCount();
        onProgress?.(index + 1, files.length);
      }
      const blob = await saveDoc(merged);
      return {
        summary: `Merged ${files.length} files into ${count} pages`,
        files: [{ filename: "merged.pdf", blob }],
      };
    }

    case "split-pdf": {
      const { PDFDocument } = await loadLib();
      const source = await loadDoc(first);
      const total = source.getPageCount();
      const groups: number[][] = [];
      const labels: string[] = [];
      if (options.mode === "ranges") {
        for (const part of (options.ranges ?? "").split(",").map((entry) => entry.trim()).filter(Boolean)) {
          groups.push(parsePageList(part, total));
          labels.push(part.replace(/\s+/g, ""));
        }
        if (!groups.length) throw new Error("Enter at least one range, for example 1-3, 4-6, 9.");
      } else {
        for (let index = 0; index < total; index += 1) {
          groups.push([index]);
          labels.push(String(index + 1));
        }
      }
      const output: PdfOutputFile[] = [];
      for (const [index, group] of groups.entries()) {
        const part = await PDFDocument.create();
        await copyPagesInto(part, source, group);
        output.push({ filename: `${name}-pages-${labels[index]}.pdf`, blob: await saveDoc(part) });
        onProgress?.(index + 1, groups.length);
      }
      return { summary: `Created ${output.length} PDF file${output.length === 1 ? "" : "s"} from ${total} pages`, files: output };
    }

    case "rotate-pdf": {
      const { degrees } = await loadLib();
      const doc = await loadDoc(first);
      const total = doc.getPageCount();
      const targets = options.pages?.trim() ? parsePageList(options.pages, total) : doc.getPageIndices();
      const angle = Number(options.angle ?? "90");
      for (const index of targets) {
        const page = doc.getPage(index);
        page.setRotation(degrees(((page.getRotation().angle + angle) % 360 + 360) % 360));
      }
      return {
        summary: `Rotated ${targets.length} of ${total} pages by ${angle}°`,
        files: [{ filename: `${name}-rotated.pdf`, blob: await saveDoc(doc) }],
      };
    }

    case "delete-pdf-pages": {
      const doc = await loadDoc(first);
      const total = doc.getPageCount();
      const remove = parsePageList(options.pages ?? "", total);
      if (remove.length >= total) throw new Error("You can't delete every page. Leave at least one.");
      [...remove].reverse().forEach((index) => doc.removePage(index));
      return {
        summary: `Deleted ${remove.length} page${remove.length === 1 ? "" : "s"}; ${doc.getPageCount()} remain`,
        files: [{ filename: `${name}-edited.pdf`, blob: await saveDoc(doc) }],
      };
    }

    case "pdf-page-extractor":
    case "pdf-page-organizer": {
      const { PDFDocument } = await loadLib();
      const source = await loadDoc(first);
      const organize = toolId === "pdf-page-organizer";
      const indexes = parsePageList(options.pages ?? "", source.getPageCount(), {
        allowRepeat: organize,
        keepOrder: organize,
      });
      const output = await PDFDocument.create();
      await copyPagesInto(output, source, indexes);
      return {
        summary: `${organize ? "Rebuilt" : "Extracted"} a ${indexes.length}-page PDF`,
        files: [{ filename: `${name}-${organize ? "organized" : "extracted"}.pdf`, blob: await saveDoc(output) }],
      };
    }

    case "add-pdf-page-numbers": {
      const { StandardFonts, rgb } = await loadLib();
      const doc = await loadDoc(first);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const total = doc.getPageCount();
      const start = Math.max(0, Math.floor(Number(options.start ?? "1")) || 1);
      const size = Math.min(48, Math.max(6, Number(options.size ?? "11") || 11));
      const position = options.position ?? "bottom-center";
      const format = options.format ?? "n";
      doc.getPages().forEach((page, index) => {
        const number = start + index;
        const label =
          format === "page-n" ? `Page ${number}` : format === "page-n-of" ? `Page ${number} of ${start + total - 1}` : String(number);
        const width = font.widthOfTextAtSize(label, size);
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const margin = 28;
        const x = position.endsWith("left") ? margin : position.endsWith("right") ? pageWidth - margin - width : (pageWidth - width) / 2;
        const y = position.startsWith("top") ? pageHeight - margin - size * 0.7 : margin;
        page.drawText(label, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
      });
      return {
        summary: `Numbered ${total} pages starting at ${start}`,
        files: [{ filename: `${name}-numbered.pdf`, blob: await saveDoc(doc) }],
      };
    }

    case "watermark-pdf": {
      const { StandardFonts, rgb, degrees } = await loadLib();
      const text = (options.text ?? "").trim();
      if (!text) throw new Error("Enter the watermark text.");
      const doc = await loadDoc(first);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const size = Math.min(200, Math.max(10, Number(options.size ?? "60") || 60));
      const opacity = Math.min(1, Math.max(0.05, Number(options.opacity ?? "25") / 100 || 0.25));
      const palette: Record<string, [number, number, number]> = {
        gray: [0.45, 0.45, 0.45],
        red: [0.85, 0.15, 0.15],
        blue: [0.1, 0.35, 0.9],
        black: [0, 0, 0],
      };
      const [r, g, b] = palette[options.color ?? "gray"] ?? palette.gray;
      const angle = options.angle === "horizontal" ? 0 : 45;
      const radians = (angle * Math.PI) / 180;
      let textWidth: number;
      try {
        textWidth = font.widthOfTextAtSize(text, size);
      } catch {
        throw new Error("This watermark uses characters the built-in font can't draw. Use Latin letters and numbers.");
      }
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const a = textWidth / 2;
        const bOffset = size * 0.3;
        page.drawText(text, {
          x: width / 2 - (a * Math.cos(radians) - bOffset * Math.sin(radians)),
          y: height / 2 - (a * Math.sin(radians) + bOffset * Math.cos(radians)),
          size,
          font,
          color: rgb(r, g, b),
          opacity,
          rotate: degrees(angle),
        });
      }
      return {
        summary: `Watermarked ${doc.getPageCount()} pages`,
        files: [{ filename: `${name}-watermarked.pdf`, blob: await saveDoc(doc) }],
      };
    }

    case "pdf-metadata-viewer": {
      const doc = await loadDoc(first, true);
      const header = new TextDecoder().decode(new Uint8Array(await first.slice(0, 8).arrayBuffer()));
      const date = (value: Date | undefined) => (value ? value.toLocaleString() : "—");
      const rows: [string, string][] = [
        ["File name", first.name],
        ["File size", formatBytes(first.size)],
        ["PDF version", /^%PDF-(\d\.\d)/.exec(header)?.[1] ?? "Unknown"],
        ["Pages", String(doc.getPageCount())],
        ["Title", doc.getTitle() || "—"],
        ["Author", doc.getAuthor() || "—"],
        ["Subject", doc.getSubject() || "—"],
        ["Keywords", doc.getKeywords() || "—"],
        ["Creator", doc.getCreator() || "—"],
        ["Producer", doc.getProducer() || "—"],
        ["Created", date(doc.getCreationDate())],
        ["Modified", date(doc.getModificationDate())],
        ["Encrypted", doc.isEncrypted ? "Yes" : "No"],
      ];
      return {
        summary: `${doc.getPageCount()} pages · ${formatBytes(first.size)}`,
        files: [],
        text: rows.map(([key, value]) => `${key.padEnd(12)} ${value}`).join("\n"),
      };
    }

    case "pdf-metadata-editor": {
      const doc = await loadDoc(first);
      const clear = options.clear === "on";
      const set = (value: string | undefined) => (clear ? "" : (value ?? "").trim());
      doc.setTitle(set(options.title));
      doc.setAuthor(set(options.author));
      doc.setSubject(set(options.subject));
      doc.setKeywords(
        set(options.keywords)
          .split(",")
          .map((word) => word.trim())
          .filter(Boolean),
      );
      doc.setCreator(set(options.creator));
      doc.setProducer(set(options.producer));
      return {
        summary: clear ? "Cleared document properties" : "Updated document properties",
        files: [{ filename: `${name}-metadata.pdf`, blob: await saveDoc(doc) }],
      };
    }

    case "pdf-page-size-checker":
    case "pdf-print-size-checker": {
      const doc = await loadDoc(first, true);
      const sizes = doc.getPages().map((page) => {
        const rotation = ((page.getRotation().angle % 360) + 360) % 360;
        const { width, height } = page.getSize();
        const swap = rotation === 90 || rotation === 270;
        return { width: swap ? height : width, height: swap ? width : height, rotation };
      });
      const { text, summary } = describeSizes(sizes, toolId === "pdf-print-size-checker");
      return { summary, files: [], text };
    }

    case "compare-pdfs": {
      if (files.length < 2) throw new Error("Choose two PDF files to compare.");
      const [fileA, fileB] = files;
      const pagesA = await extractPageTexts(fileA, (done, total) => onProgress?.(done, total * 2));
      const pagesB = await extractPageTexts(fileB, (done, total) => onProgress?.(pagesA.length + done, (pagesA.length + total)));
      const out: string[] = [
        `A: ${fileA.name} (${pagesA.length} pages)`,
        `B: ${fileB.name} (${pagesB.length} pages)`,
        "",
      ];
      let different = 0;
      const pageCount = Math.max(pagesA.length, pagesB.length);
      for (let index = 0; index < pageCount; index += 1) {
        const a = pagesA[index];
        const b = pagesB[index];
        if (a === undefined || b === undefined) {
          different += 1;
          out.push(`Page ${index + 1}: only in ${a === undefined ? "B" : "A"}`);
          continue;
        }
        if (a.replace(/\s+/g, " ") === b.replace(/\s+/g, " ")) continue;
        different += 1;
        const { onlyA, onlyB } = lineDiff(a, b);
        out.push(`Page ${index + 1}: differs`);
        onlyA.slice(0, 8).forEach((line) => out.push(`  − A: ${line}`));
        if (onlyA.length > 8) out.push(`  − … ${onlyA.length - 8} more lines only in A`);
        onlyB.slice(0, 8).forEach((line) => out.push(`  + B: ${line}`));
        if (onlyB.length > 8) out.push(`  + … ${onlyB.length - 8} more lines only in B`);
      }
      const identical = different === 0;
      if (identical) out.push("The text content of both PDFs is identical.");
      return {
        summary: identical ? "No text differences found" : `${different} of ${pageCount} pages differ`,
        files: [],
        text: out.join("\n"),
        notes: ["Only the text layer is compared. Images and layout changes are not detected."],
      };
    }

    case "pdf-form-filler": {
      const lib = await loadLib();
      const doc = await loadDoc(first);
      const form = doc.getForm();
      const fields = form.getFields();
      if (!fields.length) throw new Error("This PDF has no fillable form fields.");
      let filled = 0;
      try {
        for (const field of fields) {
          const value = formValues[field.getName()];
          if (value === undefined) continue;
          if (field instanceof lib.PDFTextField) field.setText(String(value));
          else if (field instanceof lib.PDFCheckBox) (value ? field.check() : field.uncheck());
          else if (field instanceof lib.PDFDropdown && value) field.select(String(value));
          else if (field instanceof lib.PDFRadioGroup && value) field.select(String(value));
          else continue;
          filled += 1;
        }
        if (options.flatten === "on") form.flatten();
      } catch (error) {
        throw new Error(
          `Could not fill the form: ${error instanceof Error ? error.message : "unsupported characters or field"}`,
        );
      }
      return {
        summary: `Filled ${filled} field${filled === 1 ? "" : "s"}${options.flatten === "on" ? " and flattened the form" : ""}`,
        files: [{ filename: `${name}-filled.pdf`, blob: await saveDoc(doc) }],
      };
    }

    case "repair-pdf": {
      const { PDFDocument } = await loadLib();
      let source;
      try {
        source = await PDFDocument.load(await first.arrayBuffer(), {
          ignoreEncryption: true,
          throwOnInvalidObject: false,
        });
      } catch {
        throw new Error("This file is too damaged to repair in the browser.");
      }
      if (source.getPageCount() === 0) throw new Error("No readable pages were found in this file.");
      const output = await PDFDocument.create();
      let recovered = 0;
      for (const index of source.getPageIndices()) {
        try {
          await copyPagesInto(output, source, [index]);
          recovered += 1;
        } catch {
          // Skip pages that cannot be copied.
        }
      }
      if (!recovered) throw new Error("No readable pages could be recovered.");
      const lost = source.getPageCount() - recovered;
      return {
        summary: `Recovered ${recovered} of ${source.getPageCount()} pages`,
        files: [{ filename: `${name}-repaired.pdf`, blob: await saveDoc(output) }],
        notes: lost ? [`${lost} page${lost === 1 ? "" : "s"} could not be recovered.`] : undefined,
      };
    }

    case "pdf-compressor": {
      const { PDFDocument } = await loadLib();
      const levels: Record<string, { scale: number; quality: number }> = {
        strong: { scale: 1, quality: 0.5 },
        balanced: { scale: 1.5, quality: 0.7 },
        light: { scale: 2, quality: 0.85 },
      };
      const level = levels[options.level ?? "balanced"] ?? levels.balanced;
      const pdf = await openPdfJs(first);
      const output = await PDFDocument.create();
      try {
        for (let number = 1; number <= pdf.numPages; number += 1) {
          const page = await pdf.getPage(number);
          const canvas = await renderPageToCanvas(page, level.scale);
          const blob = await canvasToBlob(canvas, "image/jpeg", level.quality);
          const image = await output.embedJpg(new Uint8Array(await blob.arrayBuffer()));
          const view = page.getViewport({ scale: 1 });
          const target = output.addPage([view.width, view.height]);
          target.drawImage(image, { x: 0, y: 0, width: view.width, height: view.height });
          page.cleanup();
          onProgress?.(number, pdf.numPages);
        }
      } finally {
        void pdf.loadingTask.destroy();
      }
      const blob = await saveDoc(output);
      const saved = Math.round((1 - blob.size / first.size) * 100);
      const notes = ["Pages are re-rendered as images, so text in the result can no longer be selected or searched."];
      if (blob.size >= first.size) notes.unshift("The result is not smaller than the original. Try “Strong” compression, or keep the original file.");
      return {
        summary: `${formatBytes(first.size)} → ${formatBytes(blob.size)} (${saved >= 0 ? `${saved}% smaller` : `${Math.abs(saved)}% larger`})`,
        files: [{ filename: `${name}-compressed.pdf`, blob }],
        notes,
      };
    }

    case "pdf-to-text":
    case "pdf-text-extractor":
    case "pdf-to-html":
    case "pdf-to-markdown": {
      const pages = await extractPageTexts(first, onProgress);
      const hasText = pages.some((page) => page.length > 0);
      const notes = hasText
        ? undefined
        : ["No text was found. This PDF may be scanned images, which needs OCR (not available here)."];
      if (toolId === "pdf-to-html") {
        const body = pages
          .map(
            (page, index) =>
              `<section>\n<h2>Page ${index + 1}</h2>\n${page
                .split(/\n{2,}/)
                .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>\n")}</p>`)
                .join("\n")}\n</section>`,
          )
          .join("\n");
        const html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>${escapeHtml(name)}</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
        return { summary: `Converted ${pages.length} pages to HTML`, files: [{ filename: `${name}.html`, blob: textBlob(html, "text/html") }], text: html, notes };
      }
      if (toolId === "pdf-to-markdown") {
        const markdown = `# ${name}\n\n${pages.map((page, index) => `## Page ${index + 1}\n\n${page}`).join("\n\n")}\n`;
        return { summary: `Converted ${pages.length} pages to Markdown`, files: [{ filename: `${name}.md`, blob: textBlob(markdown, "text/markdown") }], text: markdown, notes };
      }
      const text =
        toolId === "pdf-text-extractor"
          ? pages.map((page, index) => `--- Page ${index + 1} ---\n${page}`).join("\n\n")
          : pages.join("\n\n");
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      return {
        summary: `Extracted ${words.toLocaleString()} words from ${pages.length} pages`,
        files: [{ filename: `${name}.txt`, blob: textBlob(text, "text/plain") }],
        text,
        notes,
      };
    }

    case "pdf-to-jpg":
    case "pdf-to-png": {
      const png = toolId === "pdf-to-png";
      const pdf = await openPdfJs(first);
      const output: PdfOutputFile[] = [];
      try {
        const targets = options.pages?.trim()
          ? parsePageList(options.pages, pdf.numPages)
          : Array.from({ length: pdf.numPages }, (_, index) => index);
        if (targets.length > 100) throw new Error("Convert up to 100 pages at a time. Use the page range option.");
        const scale = Math.min(300, Math.max(72, Number(options.dpi ?? "150") || 150)) / 72;
        const quality = Math.min(1, Math.max(0.3, Number(options.quality ?? "90") / 100 || 0.9));
        for (const [position, index] of targets.entries()) {
          const page = await pdf.getPage(index + 1);
          const canvas = await renderPageToCanvas(page, scale);
          const blob = await canvasToBlob(canvas, png ? "image/png" : "image/jpeg", png ? undefined : quality);
          output.push({ filename: `${name}-page-${index + 1}.${png ? "png" : "jpg"}`, blob });
          page.cleanup();
          onProgress?.(position + 1, targets.length);
        }
      } finally {
        void pdf.loadingTask.destroy();
      }
      return { summary: `Rendered ${output.length} page${output.length === 1 ? "" : "s"} as ${png ? "PNG" : "JPG"}`, files: output };
    }

    case "jpg-to-pdf": {
      const { PDFDocument } = await loadLib();
      const output = await PDFDocument.create();
      const pageSize = options.pageSize ?? "fit";
      const margin = Math.min(40, Math.max(0, Number(options.margin ?? "10") || 0)) * PT_PER_MM;
      for (const [index, file] of files.entries()) {
        const image = await imageToEmbeddable(file);
        const embedded = image.kind === "jpg" ? await output.embedJpg(image.bytes) : await output.embedPng(image.bytes);
        const naturalW = image.width * 0.75;
        const naturalH = image.height * 0.75;
        let pageW = naturalW;
        let pageH = naturalH;
        let pad = 0;
        if (pageSize !== "fit") {
          const [short, long] = pageSize === "letter" ? [612, 792] : [595.28, 841.89];
          const landscape = image.width > image.height;
          pageW = landscape ? long : short;
          pageH = landscape ? short : long;
          pad = margin;
        }
        const page = output.addPage([pageW, pageH]);
        const scale = Math.min((pageW - pad * 2) / naturalW, (pageH - pad * 2) / naturalH, pageSize === "fit" ? 1 : Infinity);
        const drawW = naturalW * scale;
        const drawH = naturalH * scale;
        page.drawImage(embedded, { x: (pageW - drawW) / 2, y: (pageH - drawH) / 2, width: drawW, height: drawH });
        onProgress?.(index + 1, files.length);
      }
      return {
        summary: `Created a ${files.length}-page PDF`,
        files: [{ filename: files.length === 1 ? `${name}.pdf` : "images.pdf", blob: await saveDoc(output) }],
      };
    }
  }
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index += 1) {
    crc = crcTable[(crc ^ data[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Builds an uncompressed (stored) ZIP archive. */
export async function createZip(files: PdfOutputFile[]): Promise<Blob> {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  let offset = 0;

  for (const file of files) {
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const nameBytes = encoder.encode(file.filename);
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    parts.push(new Uint8Array(local.buffer), nameBytes, data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(12, dosTime, true);
    entry.setUint16(14, dosDate, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, nameBytes.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), nameBytes);

    offset += 30 + nameBytes.length + data.length;
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...parts, ...central, new Uint8Array(end.buffer)] as BlobPart[], { type: "application/zip" });
}
