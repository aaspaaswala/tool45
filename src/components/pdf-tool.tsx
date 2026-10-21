"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Download,
  FilePlus2,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  createZip,
  formatBytes,
  MAX_PDF_BYTES,
  MAX_PDF_FILES,
  readFormFields,
  readMetadata,
  runPdfTool,
  type PdfFormField,
  type PdfMetadata,
  type PdfResult,
} from "@/lib/tools/pdf-processing";
import {
  pdfImageInputTools,
  pdfMultiFileTools,
  pdfToolIntros,
  type PdfToolId,
} from "@/lib/tools/pdf-tool-config";

const actionLabels: Partial<Record<PdfToolId, string>> = {
  "merge-pdf": "Merge PDFs",
  "split-pdf": "Split PDF",
  "rotate-pdf": "Rotate PDF",
  "delete-pdf-pages": "Delete pages",
  "pdf-page-extractor": "Extract pages",
  "pdf-page-organizer": "Rebuild PDF",
  "add-pdf-page-numbers": "Add page numbers",
  "watermark-pdf": "Add watermark",
  "pdf-metadata-viewer": "View metadata",
  "pdf-metadata-editor": "Save metadata",
  "pdf-page-size-checker": "Check page sizes",
  "pdf-print-size-checker": "Check print sizes",
  "compare-pdfs": "Compare PDFs",
  "pdf-form-filler": "Fill form",
  "repair-pdf": "Repair PDF",
  "pdf-compressor": "Compress PDF",
  "pdf-to-text": "Extract text",
  "pdf-text-extractor": "Extract text",
  "pdf-to-html": "Convert to HTML",
  "pdf-to-markdown": "Convert to Markdown",
  "pdf-to-jpg": "Convert to JPG",
  "pdf-to-png": "Convert to PNG",
  "jpg-to-pdf": "Create PDF",
};

const settingsTools = new Set<PdfToolId>([
  "split-pdf",
  "rotate-pdf",
  "delete-pdf-pages",
  "pdf-page-extractor",
  "pdf-page-organizer",
  "add-pdf-page-numbers",
  "watermark-pdf",
  "pdf-metadata-editor",
  "pdf-form-filler",
  "pdf-compressor",
  "pdf-to-jpg",
  "pdf-to-png",
  "jpg-to-pdf",
]);

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isAccepted(file: File, images: boolean): boolean {
  if (images) return /^image\/(jpeg|png|webp|gif|bmp|avif)$/.test(file.type) || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name);
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function PdfTool({ toolId }: { toolId: PdfToolId }) {
  const images = pdfImageInputTools.has(toolId);
  const multiple = pdfMultiFileTools.has(toolId) || toolId === "compare-pdfs";
  const maxFiles = toolId === "compare-pdfs" ? 2 : multiple ? MAX_PDF_FILES : 1;
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PdfResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [meta, setMeta] = useState<PdfMetadata | null>(null);
  const [formFields, setFormFields] = useState<PdfFormField[] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [wmAngle, setWmAngle] = useState("diagonal");

  const firstFile = files[0];

  useEffect(() => {
    setMeta(null);
    setFormFields(null);
    setFormValues({});
    if (!firstFile) return;
    if (toolId !== "pdf-metadata-editor" && toolId !== "pdf-form-filler") return;
    let cancelled = false;
    (async () => {
      try {
        if (toolId === "pdf-metadata-editor") {
          const loaded = await readMetadata(firstFile);
          if (!cancelled) setMeta(loaded);
        } else {
          const fields = await readFormFields(firstFile);
          if (cancelled) return;
          setFormFields(fields);
          setFormValues(Object.fromEntries(fields.map((field) => [field.name, field.value])));
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not read this PDF.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firstFile, toolId]);

  const previews = useMemo(
    () =>
      (result?.files ?? [])
        .filter((file) => file.blob.type.startsWith("image/"))
        .slice(0, 12)
        .map((file) => ({ name: file.filename, url: URL.createObjectURL(file.blob) })),
    [result],
  );
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  function clearOutput() {
    setResult(null);
    setError("");
    setCopied(false);
  }

  function addFiles(incoming: FileList | File[]) {
    clearOutput();
    const accepted: File[] = [];
    for (const file of Array.from(incoming)) {
      if (!isAccepted(file, images)) {
        setError(`"${file.name}" is not a ${images ? "supported image" : "PDF"} file.`);
        continue;
      }
      if (file.size > MAX_PDF_BYTES) {
        setError(`"${file.name}" is larger than ${formatBytes(MAX_PDF_BYTES)}.`);
        continue;
      }
      accepted.push(file);
    }
    if (!accepted.length) return;
    setFiles((current) => {
      const next = multiple ? [...current, ...accepted] : accepted.slice(0, 1);
      if (next.length > maxFiles) {
        setError(`You can add up to ${maxFiles} files.`);
        return next.slice(0, maxFiles);
      }
      return next;
    });
  }

  function moveFile(index: number, direction: -1 | 1) {
    setFiles((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function reset() {
    setFiles([]);
    clearOutput();
    if (inputRef.current) inputRef.current.value = "";
  }

  const needsTwo = toolId === "compare-pdfs";
  const ready = files.length > 0 && (!needsTwo || files.length === 2) && (toolId !== "merge-pdf" || files.length >= 2);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || busy) return;
    clearOutput();
    setBusy(true);
    setProgress(null);
    try {
      const data = formRef.current ? new FormData(formRef.current) : new FormData();
      const options: Record<string, string> = {};
      data.forEach((value, key) => {
        if (typeof value === "string") options[key] = value;
      });
      const output = await runPdfTool(toolId, files, options, formValues, (done, total) => setProgress([done, total]));
      setResult(output);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong while processing this file.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function downloadAll() {
    if (!result) return;
    download(await createZip(result.files), "toolhub-pdf-files.zip");
  }

  async function copyText() {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy failed. Select the text and copy it manually.");
    }
  }

  function renderSettings() {
    switch (toolId) {
      case "split-pdf":
        return (
          <>
            <label className="image-setting-wide">
              Split mode
              <select defaultValue="each" name="mode">
                <option value="each">Every page as its own PDF</option>
                <option value="ranges">Custom page ranges</option>
              </select>
            </label>
            <label className="image-setting-wide">
              Ranges (used for custom ranges)
              <input name="ranges" placeholder="1-3, 4-6, 9" type="text" />
            </label>
            <div className="image-setting-hint">Each comma-separated range becomes its own PDF file.</div>
          </>
        );
      case "rotate-pdf":
        return (
          <>
            <label>
              Rotation
              <select defaultValue="90" name="angle">
                <option value="90">90° clockwise</option>
                <option value="180">180°</option>
                <option value="270">90° counter-clockwise</option>
              </select>
            </label>
            <label>
              Pages
              <input name="pages" placeholder="All pages (or 1-3, 5)" type="text" />
            </label>
          </>
        );
      case "delete-pdf-pages":
      case "pdf-page-extractor":
      case "pdf-page-organizer":
        return (
          <>
            <label className="image-setting-wide">
              {toolId === "delete-pdf-pages" ? "Pages to delete" : toolId === "pdf-page-extractor" ? "Pages to extract" : "New page order"}
              <input
                name="pages"
                placeholder={toolId === "pdf-page-organizer" ? "3, 1, 2, 2, 5-7" : "1-3, 5, 8-"}
                required
                type="text"
              />
            </label>
            <div className="image-setting-hint">
              {toolId === "pdf-page-organizer"
                ? "Pages appear in the order you list them. Repeat a number to duplicate a page; unlisted pages are dropped."
                : "Use commas and ranges, for example 1-3, 5, 8-. “8-” means page 8 to the end."}
            </div>
          </>
        );
      case "add-pdf-page-numbers":
        return (
          <>
            <label>
              Position
              <select defaultValue="bottom-center" name="position">
                <option value="bottom-center">Bottom center</option>
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-left">Bottom left</option>
                <option value="top-center">Top center</option>
                <option value="top-right">Top right</option>
                <option value="top-left">Top left</option>
              </select>
            </label>
            <label>
              Format
              <select defaultValue="n" name="format">
                <option value="n">1, 2, 3</option>
                <option value="page-n">Page 1, Page 2</option>
                <option value="page-n-of">Page 1 of 10</option>
              </select>
            </label>
            <label>
              Start at
              <input defaultValue={1} min={0} name="start" type="number" />
            </label>
            <label>
              Font size
              <input defaultValue={11} max={48} min={6} name="size" type="number" />
            </label>
          </>
        );
      case "watermark-pdf":
        return (
          <>
            <label className="image-setting-wide">
              Watermark text
              <input defaultValue="CONFIDENTIAL" maxLength={60} name="text" required type="text" />
            </label>
            <label>
              Font size
              <input defaultValue={60} max={200} min={10} name="size" type="number" />
            </label>
            <label>
              Opacity (%)
              <input defaultValue={25} max={100} min={5} name="opacity" type="number" />
            </label>
            <label>
              Color
              <select defaultValue="gray" name="color">
                <option value="gray">Gray</option>
                <option value="black">Black</option>
                <option value="red">Red</option>
                <option value="blue">Blue</option>
              </select>
            </label>
            <label>
              Direction
              <select name="angle" onChange={(event) => setWmAngle(event.target.value)} value={wmAngle}>
                <option value="diagonal">Diagonal</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </label>
          </>
        );
      case "pdf-metadata-editor":
        return meta ? (
          <>
            {(["title", "author", "subject", "keywords", "creator", "producer"] as const).map((key) => (
              <label className={key === "title" || key === "keywords" ? "image-setting-wide" : undefined} key={`${key}-${firstFile?.name}`}>
                {key[0].toUpperCase() + key.slice(1)}
                <input defaultValue={meta[key]} name={key} type="text" />
              </label>
            ))}
            <label className="image-setting-check image-setting-wide">
              <input name="clear" type="checkbox" />
              Clear all properties instead
            </label>
            <div className="image-setting-hint">Separate keywords with commas.</div>
          </>
        ) : (
          <div className="image-setting-hint">{firstFile ? "Reading document properties…" : "Choose a PDF to edit its properties."}</div>
        );
      case "pdf-form-filler":
        return formFields ? (
          formFields.length ? (
            <>
              {formFields.map((field) => (
                <label className={field.kind === "checkbox" ? "image-setting-check image-setting-wide" : "image-setting-wide"} key={field.name}>
                  {field.kind === "checkbox" ? (
                    <>
                      <input
                        checked={Boolean(formValues[field.name])}
                        onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.checked }))}
                        type="checkbox"
                      />
                      {field.name}
                    </>
                  ) : field.options ? (
                    <>
                      {field.name}
                      <select
                        onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                        value={String(formValues[field.name] ?? "")}
                      >
                        <option value="">—</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      {field.name}
                      <input
                        onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                        type="text"
                        value={String(formValues[field.name] ?? "")}
                      />
                    </>
                  )}
                </label>
              ))}
              <label className="image-setting-check image-setting-wide">
                <input name="flatten" type="checkbox" />
                Flatten form (make the answers permanent)
              </label>
            </>
          ) : (
            <div className="image-setting-hint">This PDF has no fillable form fields.</div>
          )
        ) : (
          <div className="image-setting-hint">{firstFile ? "Looking for form fields…" : "Choose a fillable PDF to see its fields."}</div>
        );
      case "pdf-compressor":
        return (
          <>
            <label className="image-setting-wide">
              Compression level
              <select defaultValue="balanced" name="level">
                <option value="strong">Strong — smallest file, lower quality</option>
                <option value="balanced">Balanced — good for sharing</option>
                <option value="light">Light — best quality</option>
              </select>
            </label>
            <div className="image-setting-hint">
              Pages are re-rendered as images, so text becomes unselectable. Best for scans and photo-heavy PDFs.
            </div>
          </>
        );
      case "pdf-to-jpg":
      case "pdf-to-png":
        return (
          <>
            <label>
              Resolution
              <select defaultValue="150" name="dpi">
                <option value="72">72 DPI (small)</option>
                <option value="110">110 DPI</option>
                <option value="150">150 DPI (recommended)</option>
                <option value="200">200 DPI</option>
                <option value="300">300 DPI (print)</option>
              </select>
            </label>
            <label>
              Pages
              <input name="pages" placeholder="All pages (or 1-3, 5)" type="text" />
            </label>
            {toolId === "pdf-to-jpg" && (
              <label className="image-setting-wide">
                JPG quality (%)
                <input defaultValue={90} max={100} min={30} name="quality" type="number" />
              </label>
            )}
          </>
        );
      case "jpg-to-pdf":
        return (
          <>
            <label>
              Page size
              <select defaultValue="fit" name="pageSize">
                <option value="fit">Fit to image</option>
                <option value="a4">A4</option>
                <option value="letter">US Letter</option>
              </select>
            </label>
            <label>
              Margin (mm)
              <input defaultValue={10} max={40} min={0} name="margin" type="number" />
            </label>
            <div className="image-setting-hint">Margins apply to A4 and Letter pages. Landscape images get landscape pages.</div>
          </>
        );
      default:
        return null;
    }
  }

  const hasSettings = settingsTools.has(toolId);
  const actionLabel = actionLabels[toolId] ?? "Process";
  const slotLabels = needsTwo ? ["Document A", "Document B"] : [];

  return (
    <div className="image-tool-layout">
      <section className="image-tool-workspace" aria-label={`${pdfToolIntros[toolId]} workspace`}>
        <div className="image-tool-panel">
          <div className="image-tool-panel-heading">
            <div>
              <h2>{files.length ? (images ? "Your images" : files.length > 1 ? "Your PDFs" : "Your PDF") : images ? "Choose your images" : "Choose your PDF"}</h2>
              <p>
                {images
                  ? `JPG, PNG, WebP · up to ${MAX_PDF_FILES} images · 50 MB each`
                  : toolId === "merge-pdf"
                    ? `Add 2 to ${MAX_PDF_FILES} PDFs · order matters · 50 MB each`
                    : needsTwo
                      ? "Add two PDFs to compare · 50 MB each"
                      : "PDF files up to 50 MB"}
              </p>
            </div>
            <button className="tool-quiet-button" disabled={!files.length} onClick={reset} type="button">
              <RotateCcw size={15} aria-hidden="true" />
              Reset
            </button>
          </div>
          <div
            className={`image-dropzone${dragging ? " image-dropzone-active" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
          >
            <input
              accept={images ? "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif" : "application/pdf,.pdf"}
              aria-label={images ? "Choose images" : "Choose PDF files"}
              hidden
              multiple={multiple}
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files);
                event.target.value = "";
              }}
              ref={inputRef}
              type="file"
            />
            <span className="image-dropzone-icon">
              <FilePlus2 size={22} aria-hidden="true" />
            </span>
            <strong>
              {files.length
                ? `${files.length} file${files.length === 1 ? "" : "s"} selected`
                : images
                  ? "Drop your images here"
                  : "Drop your PDF here"}
            </strong>
            <span>or</span>
            <button className="secondary-button" onClick={() => inputRef.current?.click()} type="button">
              <Upload size={15} aria-hidden="true" />
              {multiple && files.length > 0 ? "Add more files" : "Browse files"}
            </button>
            {files.length > 0 && (
              <ul className="image-file-list" aria-label="Selected files">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`}>
                    <span className="image-file-index">{slotLabels[index] ? slotLabels[index].slice(-1) : String(index + 1).padStart(2, "0")}</span>
                    <span className="image-file-name" title={file.name}>
                      {file.name}
                    </span>
                    <small>{formatBytes(file.size)}</small>
                    {multiple && !needsTwo && (
                      <span className="image-file-actions">
                        <button aria-label={`Move ${file.name} up`} disabled={index === 0} onClick={() => moveFile(index, -1)} type="button">
                          <ChevronUp size={14} aria-hidden="true" />
                        </button>
                        <button
                          aria-label={`Move ${file.name} down`}
                          disabled={index === files.length - 1}
                          onClick={() => moveFile(index, 1)}
                          type="button"
                        >
                          <ChevronDown size={14} aria-hidden="true" />
                        </button>
                      </span>
                    )}
                    <button
                      aria-label={`Remove ${file.name}`}
                      className="image-file-remove"
                      onClick={() => {
                        clearOutput();
                        setFiles((current) => current.filter((_, position) => position !== index));
                      }}
                      type="button"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <form
          className={hasSettings ? "image-tool-panel image-settings" : "image-tool-action-row"}
          key={`${toolId}-${firstFile?.name ?? ""}-${firstFile?.size ?? 0}`}
          onSubmit={(event) => void onSubmit(event)}
          ref={formRef}
        >
          {hasSettings && (
            <>
              <div className="image-tool-panel-heading">
                <div>
                  <h2>Settings</h2>
                </div>
              </div>
              <div className="image-settings-grid">{renderSettings()}</div>
            </>
          )}
          <button className="button-primary image-process-button" disabled={!ready || busy} type="submit">
            {busy ? <span className="image-spinner" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
            {busy ? (progress ? `Processing ${progress[0]} of ${progress[1]}…` : "Processing in your browser…") : actionLabel}
          </button>
        </form>

        {error && (
          <p className="image-error" role="alert">
            {error}
          </p>
        )}

        {result && (
          <div className="image-result-panel" aria-live="polite">
            <div className="image-tool-panel-heading">
              <div>
                <h2>{result.files.length ? "Your result is ready" : "Result"}</h2>
                <p>{result.summary}</p>
              </div>
              {result.files.length > 1 ? (
                <button className="button-primary image-download-button" onClick={() => void downloadAll()} type="button">
                  <Download size={15} aria-hidden="true" /> Download all (ZIP)
                </button>
              ) : result.files.length === 1 ? (
                <button
                  className="button-primary image-download-button"
                  onClick={() => download(result.files[0].blob, result.files[0].filename)}
                  type="button"
                >
                  <Download size={15} aria-hidden="true" /> Download
                </button>
              ) : null}
              {result.text && result.files.length === 0 && (
                <button className="secondary-button" onClick={() => void copyText()} type="button">
                  {copied ? <Check size={15} /> : <Clipboard size={15} />} {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            {result.notes?.map((note) => (
              <p className="image-setting-hint" key={note}>
                {note}
              </p>
            ))}
            {previews.length > 0 && (
              <div className="pdf-preview-grid">
                {previews.map((preview) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={preview.name} key={preview.name} src={preview.url} />
                ))}
              </div>
            )}
            {result.files.length > 0 && (
              <ul className="pdf-output-list">
                {result.files.map((file) => (
                  <li key={file.filename}>
                    <span title={file.filename}>{file.filename}</span>
                    <small>{formatBytes(file.blob.size)}</small>
                    <button className="secondary-button" onClick={() => download(file.blob, file.filename)} type="button">
                      <Download size={14} aria-hidden="true" /> Save
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {result.text && (
              <>
                {result.files.length > 0 && (
                  <button className="tool-quiet-button" onClick={() => void copyText()} type="button">
                    {copied ? <Check size={15} /> : <Clipboard size={15} />} {copied ? "Copied" : "Copy text"}
                  </button>
                )}
                <pre className="image-text-result">{result.text.length > 200_000 ? `${result.text.slice(0, 200_000)}\n\n… preview truncated, download the file for the full text.` : result.text}</pre>
              </>
            )}
          </div>
        )}
      </section>

      <aside className="image-tool-aside">
        <div className="tool-info-card">
          <span className="tool-info-icon">
            <ShieldCheck size={17} aria-hidden="true" />
          </span>
          <h2>Private processing</h2>
          <p>PDFs are processed in your browser and are never uploaded.</p>
        </div>
        <p className="tool-limitation">Max file size: 50 MB. Password-protected PDFs are not supported.</p>
      </aside>
    </div>
  );
}
