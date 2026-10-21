"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Download,
  ImagePlus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

import {
  canvasFor,
  canvasToBlob,
  downloadBlob,
  fileNameWithoutExtension,
  getCanvasContext,
  getImageExtension,
  getMimeForFormat,
  imageDataUrlToFile,
  loadRaster,
  readDpiMetadata,
  validateImageFile,
} from "@/lib/tools/image-processing";
import {
  imageToolIntros,
  type ImageToolId,
} from "@/lib/tools/image-tool-config";

interface ImageResult {
  blob?: Blob;
  filename?: string;
  text?: string;
  details?: string;
  mime?: string;
}

const MAX_BATCH_FILES = 20;
const acceptedTypes =
  ".jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.svg,.heic,.heif,.tif,.tiff,image/*";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function parseNumber(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIco(png: Blob): Promise<Blob> {
  return png.arrayBuffer().then((buffer) => {
    const pngBytes = new Uint8Array(buffer);
    const header = new ArrayBuffer(22);
    const view = new DataView(header);
    view.setUint16(2, 1, true);
    view.setUint16(4, 1, true);
    view.setUint8(6, 0);
    view.setUint8(7, 0);
    view.setUint8(8, 0);
    view.setUint8(9, 0);
    view.setUint16(10, 1, true);
    view.setUint16(12, 32, true);
    view.setUint32(14, pngBytes.length, true);
    view.setUint32(18, 22, true);
    const result = new Uint8Array(22 + pngBytes.length);
    result.set(new Uint8Array(header));
    result.set(pngBytes, 22);
    return new Blob([result], { type: "image/x-icon" });
  });
}

function imageOnCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
  options?: { fit?: "cover" | "contain"; background?: string },
): HTMLCanvasElement {
  const canvas = canvasFor(width, height);
  const context = getCanvasContext(canvas);
  if (options?.background) {
    context.fillStyle = options.background;
    context.fillRect(0, 0, width, height);
  }
  const fit = options?.fit ?? "contain";
  const scale =
    fit === "cover"
      ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
      : Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  return canvas;
}

async function jpegClosestToSize(
  canvas: HTMLCanvasElement,
  targetBytes: number,
): Promise<{ blob: Blob; exact: boolean }> {
  let low = 0.08;
  let high = 0.98;
  let best: Blob | undefined;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const quality = (low + high) / 2;
    const candidate = await canvasToBlob(canvas, "image/jpeg", quality);
    if (!best || Math.abs(candidate.size - targetBytes) < Math.abs(best.size - targetBytes)) {
      best = candidate;
    }
    if (candidate.size > targetBytes) {
      high = quality;
    } else {
      low = quality;
    }
  }

  const blob = best ?? (await canvasToBlob(canvas, "image/jpeg", 0.75));
  return { blob, exact: blob.size <= targetBytes };
}

export function ImageTool({ toolId }: { toolId: ImageToolId }) {
  const wantsBase64 = toolId === "base64-to-image";
  const wantsTwoImages = toolId === "photo-signature-combiner";
  const supportsMultiple = toolId === "multiple-images-to-pdf";
  const supportsFileQueue = supportsMultiple || wantsTwoImages;
  const [files, setFiles] = useState<File[]>([]);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState("");
  const [base64Input, setBase64Input] = useState("");
  const [result, setResult] = useState<ImageResult | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [pickedColor, setPickedColor] = useState("");
  const previewRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLFormElement>(null);
  const previewRequestRef = useRef(0);
  const previewUrl = useMemo(
    () => (result?.blob ? URL.createObjectURL(result.blob) : ""),
    [result?.blob],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    };
  }, [sourcePreviewUrl]);

  async function loadSourcePreview(file: File | undefined) {
    const request = ++previewRequestRef.current;
    setSourcePreviewUrl("");
    setDimensions({ width: 0, height: 0 });
    if (!file) return;

    try {
      const raster = await loadRaster(file);
      try {
        const preview = await canvasToBlob(
          imageOnCanvas(raster.image, raster.width, raster.height),
          "image/png",
        );
        if (request !== previewRequestRef.current) return;
        setDimensions({ width: raster.width, height: raster.height });
        setSourcePreviewUrl(URL.createObjectURL(preview));
      } finally {
        raster.dispose();
      }
    } catch (loadError) {
      if (request === previewRequestRef.current) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "This image could not be opened.",
        );
      }
    }
  }

  async function acceptFiles(selected: FileList | File[], append = false) {
    const chosen = Array.from(selected);
    if (!chosen.length) return;
    if (!supportsFileQueue && chosen.length > 1) {
      setError("Choose one image for this tool.");
      return;
    }

    const invalid = chosen
      .map((file) => ({ file, message: validateImageFile(file) }))
      .find((entry) => entry.message);
    if (invalid) {
      setError(`${invalid.file.name}: ${invalid.message}`);
      return;
    }

    const shouldAppend = append && supportsFileQueue;
    const additions = shouldAppend
      ? chosen.filter(
          (file) =>
            !files.some(
              (existing) =>
                existing.name === file.name &&
                existing.size === file.size &&
                existing.lastModified === file.lastModified,
            ),
        )
      : chosen;
    if (shouldAppend && additions.length === 0) {
      setNotice("Those files are already in the selection.");
      return;
    }
    const nextFiles = shouldAppend ? [...files, ...additions] : additions;
    const maxFiles = wantsTwoImages ? 2 : MAX_BATCH_FILES;
    if (nextFiles.length > maxFiles) {
      setError(
        wantsTwoImages
          ? "Choose only two images: a portrait and a signature."
          : `Choose no more than ${MAX_BATCH_FILES} images at a time.`,
      );
      return;
    }
    if (!nextFiles.length) {
      setNotice("Those files are already in the selection.");
      return;
    }

    setFiles(nextFiles);
    setResult(null);
    setError("");
    setNotice("");
    setPickedColor("");
    if (!shouldAppend || files.length === 0) await loadSourcePreview(nextFiles[0]);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      void acceptFiles(event.target.files, files.length > 0);
      event.target.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void acceptFiles(event.dataTransfer.files, files.length > 0);
  }

  function removeFile(index: number) {
    const nextFiles = files.filter((_, fileIndex) => fileIndex !== index);
    setFiles(nextFiles);
    setResult(null);
    setError("");
    setNotice("");
    setPickedColor("");
    if (index === 0) void loadSourcePreview(nextFiles[0]);
  }

  function moveFile(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= files.length) return;
    const nextFiles = [...files];
    [nextFiles[index], nextFiles[destination]] = [
      nextFiles[destination],
      nextFiles[index],
    ];
    setFiles(nextFiles);
    setResult(null);
    setError("");
    setNotice("");
    setPickedColor("");
    if (index === 0 || destination === 0) void loadSourcePreview(nextFiles[0]);
  }

  function reset() {
    setFiles([]);
    setBase64Input("");
    setResult(null);
    setError("");
    setNotice("");
    setDimensions({ width: 0, height: 0 });
    setPickedColor("");
    setCopied(false);
    void loadSourcePreview(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function processImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setResult(null);
    setCopied(false);

    let workingFiles = files;
    if (toolId === "base64-to-image") {
      try {
        workingFiles = [imageDataUrlToFile(base64Input)];
      } catch (inputError) {
        setError(inputError instanceof Error ? inputError.message : "Invalid data URL.");
        return;
      }
    }
    if (!workingFiles.length) {
      setError("Choose an image to continue.");
      return;
    }
    if (toolId === "photo-signature-combiner" && workingFiles.length < 2) {
      setError("Choose both a portrait and a signature image to continue.");
      return;
    }

    setBusy(true);
    try {
      const form = settingsRef.current;
      if (!form) throw new Error("Image settings are unavailable.");
      const settings = new FormData(form);
      const first = await loadRaster(workingFiles[0]);
      let output: ImageResult = {};

      try {
        const source = first.image;
        const width = first.width;
        const height = first.height;
        const sourceExtension = getImageExtension(workingFiles[0].name);
        const requiredExtensions: Partial<Record<ImageToolId, string[]>> = {
          "jpg-to-png": ["jpg"],
          "png-to-jpg": ["png"],
          "webp-to-jpg": ["webp"],
          "jpg-to-webp": ["jpg"],
          "png-to-webp": ["png"],
          "png-to-ico": ["png"],
        };
        const required = requiredExtensions[toolId];
        if (required && !required.includes(sourceExtension)) {
          throw new Error(
            `This converter expects ${required.join(" or ").toUpperCase()} input. Choose a matching image file.`,
          );
        }
        const originalName = fileNameWithoutExtension(workingFiles[0].name);
        let canvas: HTMLCanvasElement;
        let outputType = "image/png";
        let outputName = `${originalName}-processed.png`;

        if (toolId === "image-dpi-checker") {
          const dpi = await readDpiMetadata(workingFiles[0]);
          output = {
            details: `Image dimensions: ${width.toLocaleString()} × ${height.toLocaleString()} px\n${dpi}\nPrint size at 300 DPI: ${(width / 300).toFixed(2)} × ${(height / 300).toFixed(2)} inches\nFile size: ${formatBytes(workingFiles[0].size)}\n\nPrint-size estimate assumes 300 DPI; it is not a claim about the image's actual print resolution.`,
          };
          setResult(output);
          return;
        }

        if (toolId === "image-to-base64") {
          const encodedBlob = await canvasToBlob(
            imageOnCanvas(source, width, height),
            "image/png",
          );
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("The image could not be read."));
            reader.onload = () =>
              typeof reader.result === "string"
                ? resolve(reader.result)
                : reject(new Error("The image could not be encoded."));
            reader.readAsDataURL(encodedBlob);
          });
          output = {
            text: dataUrl,
            details: `Base64 data URL · ${formatBytes(new Blob([dataUrl]).size)}`,
          };
          setResult(output);
          return;
        }

        if (toolId === "qr-image-scanner") {
          const canvas = imageOnCanvas(source, width, height);
          const context = getCanvasContext(canvas);
          const pixels = context.getImageData(0, 0, width, height);
          const qr = await import("jsqr");
          const match = qr.default(
            pixels.data,
            pixels.width,
            pixels.height,
            { inversionAttempts: "attemptBoth" },
          );
          if (!match) {
            throw new Error("No readable QR code was found. Try a sharper, well-lit image.");
          }
          output = {
            text: match.data,
            details: "QR code content",
          };
          setResult(output);
          return;
        }

        if (toolId === "image-to-ascii-art") {
          const maxWidth = 120;
          const scale = Math.min(1, maxWidth / width);
          const asciiCanvas = imageOnCanvas(
            source,
            Math.max(1, Math.round(width * scale)),
            Math.max(1, Math.round(height * scale * 0.5)),
          );
          const asciiContext = getCanvasContext(asciiCanvas);
          const pixels = asciiContext.getImageData(
            0,
            0,
            asciiCanvas.width,
            asciiCanvas.height,
          );
          const ramp = " .'`^\\\",:;Il!i~+_-?][}{1)(|\\\\/*tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
          const lines: string[] = [];
          for (let y = 0; y < pixels.height; y += 1) {
            let line = "";
            for (let x = 0; x < pixels.width; x += 1) {
              const index = (y * pixels.width + x) * 4;
              const luminance =
                0.2126 * pixels.data[index] +
                0.7152 * pixels.data[index + 1] +
                0.0722 * pixels.data[index + 2];
              line += ramp[Math.floor((luminance / 255) * (ramp.length - 1))];
            }
            lines.push(line);
          }
          output = { text: lines.join("\n"), details: "ASCII preview · max 120 columns" };
          setResult(output);
          return;
        }

        if (toolId === "image-palette-extractor") {
          const paletteCanvas = imageOnCanvas(source, 80, 80);
          const pixels = getCanvasContext(paletteCanvas).getImageData(0, 0, 80, 80).data;
          const counts = new Map<string, number>();
          for (let index = 0; index < pixels.length; index += 4) {
            const hex = `#${[pixels[index], pixels[index + 1], pixels[index + 2]]
              .map((channel) => channel.toString(16).padStart(2, "0"))
              .join("")}`;
            counts.set(hex, (counts.get(hex) ?? 0) + 1);
          }
          const colors = [...counts.entries()]
            .sort((left, right) => right[1] - left[1])
            .slice(0, 8)
            .map(([hex, count]) => `${hex.toUpperCase()}  (${Math.round((count / 6400) * 100)}%)`);
          output = {
            text: colors.join("\n"),
            details: "Dominant colors · sampled from a reduced preview",
          };
          setResult(output);
          return;
        }

        if (toolId === "photo-signature-combiner") {
          const signature = await loadRaster(workingFiles[1]);
          try {
            canvas = canvasFor(900, 1200);
            const context = getCanvasContext(canvas);
            context.fillStyle = "#fff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            const portrait = imageOnCanvas(source, 900, 900, { fit: "cover" });
            context.drawImage(portrait, 0, 0);
            const sign = imageOnCanvas(signature.image, 540, 220);
            context.drawImage(sign, 180, 940);
          } finally {
            signature.dispose();
          }
          const blob = await canvasToBlob(canvas, "image/png");
          output = {
            blob,
            filename: `${originalName}-photo-signature.png`,
            details: "900 × 1,200 px · portrait with signature",
          };
          setResult(output);
          return;
        } else if (toolId === "multiple-images-to-pdf") {
          const { jsPDF } = await import("jspdf");
          const document = new jsPDF({ unit: "px", format: [width, height] });
          for (const [index, file] of workingFiles.entries()) {
            const raster = index === 0 ? first : await loadRaster(file);
            try {
              if (index > 0) document.addPage([raster.width, raster.height]);
              const pageCanvas = imageOnCanvas(raster.image, raster.width, raster.height, {
                background: "#fff",
              });
              const jpeg = await canvasToBlob(pageCanvas, "image/jpeg", 0.92);
              const data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(new Error("An image page could not be encoded."));
                reader.onload = () =>
                  typeof reader.result === "string"
                    ? resolve(reader.result)
                    : reject(new Error("An image page could not be encoded."));
                reader.readAsDataURL(jpeg);
              });
              document.addImage(data, "JPEG", 0, 0, raster.width, raster.height);
            } finally {
              if (index > 0) raster.dispose();
            }
          }
          output = {
            blob: document.output("blob"),
            filename: "images.pdf",
            details: `${workingFiles.length} image${workingFiles.length === 1 ? "" : "s"} · one image per page`,
          };
          setResult(output);
          return;
        } else if (toolId === "image-to-pdf") {
          const { jsPDF } = await import("jspdf");
          const pageCanvas = imageOnCanvas(source, width, height, { background: "#fff" });
          const jpeg = await canvasToBlob(pageCanvas, "image/jpeg", 0.95);
          const data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("The image could not be prepared for PDF."));
            reader.onload = () =>
              typeof reader.result === "string"
                ? resolve(reader.result)
                : reject(new Error("The image could not be prepared for PDF."));
            reader.readAsDataURL(jpeg);
          });
          const document = new jsPDF({
            unit: "px",
            format: [width, height],
            orientation: width >= height ? "landscape" : "portrait",
          });
          document.addImage(data, "JPEG", 0, 0, width, height);
          output = {
            blob: document.output("blob"),
            filename: `${originalName}.pdf`,
            details: `One-page PDF · ${width} × ${height} px`,
          };
          setResult(output);
          return;
        } else if (toolId === "id-photo-sheet-maker") {
          const columns = Math.round(parseNumber(settings.get("columns"), 3));
          const rows = Math.round(parseNumber(settings.get("rows"), 4));
          const photoWidth = Math.round(parseNumber(settings.get("photoWidth"), 330));
          const photoHeight = Math.round(parseNumber(settings.get("photoHeight"), 390));
          const spacing = Math.round(parseNumber(settings.get("spacing"), 60));
          const margin = Math.round(parseNumber(settings.get("margin"), 30));
          if (
            columns < 1 || columns > 8 || rows < 1 || rows > 10 ||
            photoWidth < 50 || photoWidth > 2000 ||
            photoHeight < 50 || photoHeight > 2000 ||
            spacing < 0 || spacing > 300 || margin < 0 || margin > 300
          ) {
            throw new Error("Use 1–8 columns, 1–10 rows, photo sides from 50–2,000 px, and spacing or margins up to 300 px.");
          }
          const sheetWidth = margin * 2 + columns * photoWidth + (columns - 1) * spacing;
          const sheetHeight = margin * 2 + rows * photoHeight + (rows - 1) * spacing;
          canvas = canvasFor(sheetWidth, sheetHeight);
          const context = getCanvasContext(canvas);
          context.fillStyle = "#fff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          const portrait = imageOnCanvas(source, photoWidth, photoHeight, { fit: "cover" });
          context.strokeStyle = "#d8ded9";
          context.lineWidth = 1;
          for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
              const x = margin + column * (photoWidth + spacing);
              const y = margin + row * (photoHeight + spacing);
              context.drawImage(portrait, x, y);
              context.strokeRect(x + 0.5, y + 0.5, photoWidth - 1, photoHeight - 1);
            }
          }
          const blob = await canvasToBlob(canvas, "image/png");
          output = {
            blob,
            filename: `${originalName}-photo-sheet.png`,
            details: `${sheetWidth.toLocaleString()} × ${sheetHeight.toLocaleString()} px · ${rows * columns} photos · ${photoWidth} × ${photoHeight} px each`,
          };
          setResult(output);
          return;
        } else {
          const configuredWidth = parseNumber(settings.get("width"), width);
          const configuredHeight = parseNumber(settings.get("height"), height);
          const quality = parseNumber(settings.get("quality"), 85) / 100;
          const selectedFormat = String(settings.get("format") || "png");
          const selectedType = getMimeForFormat(selectedFormat);
          const rotation = parseNumber(settings.get("rotation"), 90);
          const blur = parseNumber(settings.get("blur"), 4);
          const brightness = parseNumber(settings.get("brightness"), 100);
          const contrast = parseNumber(settings.get("contrast"), 100);
          const watermark = String(settings.get("watermark") || "").slice(0, 100);
          const tolerance = parseNumber(settings.get("tolerance"), 32);

          if (toolId === "image-flipper") {
            canvas = canvasFor(width, height);
            const context = getCanvasContext(canvas);
            context.save();
            if (settings.get("direction") === "vertical") {
              context.translate(0, height);
              context.scale(1, -1);
            } else {
              context.translate(width, 0);
              context.scale(-1, 1);
            }
            context.drawImage(source, 0, 0);
            context.restore();
          } else if (toolId === "image-rotator") {
            const radians = (rotation * Math.PI) / 180;
            const rotatedWidth =
              rotation === 90 || rotation === 270 ? height : width;
            const rotatedHeight =
              rotation === 90 || rotation === 270 ? width : height;
            canvas = canvasFor(rotatedWidth, rotatedHeight);
            const context = getCanvasContext(canvas);
            context.translate(rotatedWidth / 2, rotatedHeight / 2);
            context.rotate(radians);
            context.drawImage(source, -width / 2, -height / 2);
          } else if (toolId === "image-cropper") {
            const cropX = parseNumber(settings.get("cropX"), 0);
            const cropY = parseNumber(settings.get("cropY"), 0);
            const cropWidth = parseNumber(settings.get("cropWidth"), width);
            const cropHeight = parseNumber(settings.get("cropHeight"), height);
            if (
              cropX < 0 ||
              cropY < 0 ||
              cropWidth < 1 ||
              cropHeight < 1 ||
              cropX + cropWidth > width ||
              cropY + cropHeight > height
            ) {
              throw new Error("Crop coordinates must fit inside the source image.");
            }
            canvas = canvasFor(cropWidth, cropHeight);
            getCanvasContext(canvas).drawImage(
              source,
              cropX,
              cropY,
              cropWidth,
              cropHeight,
              0,
              0,
              cropWidth,
              cropHeight,
            );
          } else if (
            toolId === "image-resizer" ||
            toolId === "photo-resizer-by-pixels" ||
            toolId === "signature-resizer" ||
            toolId === "social-media-image-resizer"
          ) {
            canvas = imageOnCanvas(source, configuredWidth, configuredHeight);
          } else if (toolId === "passport-photo-maker") {
            canvas = imageOnCanvas(source, configuredWidth, configuredHeight, {
              fit: "cover",
              background: "#fff",
            });
          } else if (toolId === "favicon-generator") {
            canvas = imageOnCanvas(source, 32, 32, {
              fit: "cover",
              background: "#fff",
            });
          } else if (toolId === "watermark-image") {
            canvas = imageOnCanvas(source, width, height);
            const context = getCanvasContext(canvas);
            const fontSize = Math.max(18, Math.round(Math.min(width, height) / 18));
            context.save();
            context.globalAlpha = parseNumber(settings.get("opacity"), 55) / 100;
            context.font = `700 ${fontSize}px Arial, sans-serif`;
            context.textAlign = "right";
            context.textBaseline = "bottom";
            context.lineWidth = Math.max(2, fontSize / 10);
            context.strokeStyle = "#000";
            context.fillStyle = "#fff";
            const text = watermark || "Your watermark";
            context.strokeText(text, width - fontSize, height - fontSize);
            context.fillText(text, width - fontSize, height - fontSize);
            context.restore();
          } else if (toolId === "meme-generator") {
            canvas = imageOnCanvas(source, width, height);
            const context = getCanvasContext(canvas);
            const fontSize = Math.max(20, Math.round(Math.min(width / 10, 64)));
            context.save();
            context.font = `900 ${fontSize}px Arial, sans-serif`;
            context.textAlign = "center";
            context.lineJoin = "round";
            context.lineWidth = Math.max(3, fontSize / 10);
            context.strokeStyle = "#000";
            context.fillStyle = "#fff";
            const captions: [string, number][] = [
              [String(settings.get("topText") || "").slice(0, 80), fontSize + 12],
              [String(settings.get("bottomText") || "").slice(0, 80), height - 12],
              ];
              for (const [text, y] of captions) {
                if (!text) continue;
                context.strokeText(text.toUpperCase(), width / 2, y, width - 24);
                context.fillText(text.toUpperCase(), width / 2, y, width - 24);
            }
            context.restore();
          } else if (toolId === "background-remover") {
            canvas = imageOnCanvas(source, width, height);
            const context = getCanvasContext(canvas);
            const pixels = context.getImageData(0, 0, width, height);
            const { data } = pixels;
            const reference = [data[0], data[1], data[2]];
            for (let index = 0; index < data.length; index += 4) {
              const distance = Math.hypot(
                data[index] - reference[0],
                data[index + 1] - reference[1],
                data[index + 2] - reference[2],
              );
              if (distance <= tolerance * 1.73) data[index + 3] = 0;
            }
            context.putImageData(pixels, 0, 0);
          } else {
            canvas = canvasFor(width, height);
            const context = getCanvasContext(canvas);
            if (toolId === "blur-image") {
              context.filter = `blur(${Math.min(40, Math.max(0, blur))}px)`;
            } else if (toolId === "image-brightness-adjuster") {
              context.filter = `brightness(${Math.max(0, brightness)}%)`;
            } else if (toolId === "image-contrast-adjuster") {
              context.filter = `contrast(${Math.max(0, contrast)}%)`;
            }
            context.drawImage(source, 0, 0);
            context.filter = "none";

            if (toolId === "image-to-grayscale" || toolId === "image-color-inverter") {
              const pixels = context.getImageData(0, 0, width, height);
              for (let index = 0; index < pixels.data.length; index += 4) {
                if (toolId === "image-to-grayscale") {
                  const luminance = Math.round(
                    0.2126 * pixels.data[index] +
                      0.7152 * pixels.data[index + 1] +
                      0.0722 * pixels.data[index + 2],
                  );
                  pixels.data[index] = luminance;
                  pixels.data[index + 1] = luminance;
                  pixels.data[index + 2] = luminance;
                } else {
                  pixels.data[index] = 255 - pixels.data[index];
                  pixels.data[index + 1] = 255 - pixels.data[index + 1];
                  pixels.data[index + 2] = 255 - pixels.data[index + 2];
                }
              }
              context.putImageData(pixels, 0, 0);
            }
          }

          if (toolId === "image-compressor") {
            outputType = "image/jpeg";
          } else if (
            toolId === "image-format-converter" ||
            toolId === "image-resizer" ||
            toolId === "jpg-to-png" ||
            toolId === "png-to-jpg" ||
            toolId === "webp-to-jpg" ||
            toolId === "jpg-to-webp" ||
            toolId === "png-to-webp" ||
            toolId === "avif-converter" ||
            toolId === "heic-converter" ||
            toolId === "tiff-converter" ||
            toolId === "svg-to-png" ||
            toolId === "png-to-ico"
          ) {
            outputType =
              toolId === "jpg-to-png"
                ? "image/png"
                : toolId === "jpg-to-webp" || toolId === "png-to-webp"
                  ? "image/webp"
                  : toolId === "avif-converter"
                    ? "image/avif"
                    : toolId === "heic-converter"
                      ? "image/jpeg"
                      : toolId === "tiff-converter" || toolId === "svg-to-png"
                        ? "image/png"
                        : toolId === "png-to-ico"
                          ? "image/png"
                          : toolId === "image-format-converter" ||
                              toolId === "image-resizer"
                            ? selectedType
                            : "image/jpeg";
          } else if (toolId === "image-cropper" || toolId === "passport-photo-maker") {
            outputType = "image/jpeg";
          }

          if (toolId === "photo-kb-reducer") outputType = "image/jpeg";
          if (outputType === "image/jpeg") {
            const flattened = canvasFor(canvas.width, canvas.height);
            const flattenContext = getCanvasContext(flattened);
            flattenContext.fillStyle = "#fff";
            flattenContext.fillRect(0, 0, flattened.width, flattened.height);
            flattenContext.drawImage(canvas, 0, 0);
            canvas = flattened;
          }

          let blob: Blob;
          if (toolId === "image-compressor" || toolId === "photo-kb-reducer") {
            const targetBytes =
              toolId === "photo-kb-reducer"
                ? parseNumber(settings.get("targetKB"), 200) * 1024
                : Number.MAX_SAFE_INTEGER;
            const compressed = await jpegClosestToSize(
              canvas,
              targetBytes,
            );
            blob = compressed.blob;
            if (toolId === "photo-kb-reducer" && !compressed.exact) {
              setNotice(
                "The smallest practical output is still above your target. Try smaller dimensions or a larger target size.",
              );
            }
            outputType = "image/jpeg";
          } else if (toolId === "image-flipper" || toolId === "image-rotator") {
            outputType = workingFiles[0].type === "image/jpeg" ? "image/jpeg" : "image/png";
            blob = await canvasToBlob(canvas, outputType, quality);
          } else {
            blob = await canvasToBlob(
              canvas,
              outputType,
              outputType === "image/jpeg" || outputType === "image/webp"
                ? quality
                : undefined,
            );
          }

          if (toolId === "png-to-ico") {
            blob = await toIco(blob);
            outputType = "image/x-icon";
          }
          const extension =
            outputType === "image/jpeg"
              ? "jpg"
              : outputType === "image/x-icon"
                ? "ico"
                : outputType.split("/")[1];
          outputName = `${originalName}-processed.${extension}`;
          if (toolId === "favicon-generator") outputName = "favicon-32x32.png";
          if (toolId === "png-to-ico") outputName = `${originalName}.ico`;
          if (toolId === "exif-metadata-remover") {
            outputName = `${originalName}-metadata-removed.${extension}`;
          }

          const outputDetails = [
            `${canvas.width.toLocaleString()} × ${canvas.height.toLocaleString()} px`,
            `${formatBytes(blob.size)}`,
            toolId === "image-compressor" || toolId === "photo-kb-reducer"
              ? `${formatBytes(workingFiles[0].size)} original${
                  blob.size <= workingFiles[0].size
                    ? ` · ${Math.round((1 - blob.size / workingFiles[0].size) * 100)}% smaller`
                    : " · output is larger than the original"
                }`
              : "",
            toolId === "exif-metadata-remover"
                ? workingFiles[0].type === "image/gif"
                  ? "Re-encoded as a still frame without embedded source metadata"
                  : "Re-encoded without embedded source metadata"
              : "",
          ]
            .filter(Boolean)
            .join(" · ");
          output = {
            blob,
            filename: outputName,
            details: outputDetails,
            mime: blob.type,
          };
        }
        setResult(output);
      } finally {
        first.dispose();
      }
    } catch (processingError) {
      setError(
        processingError instanceof Error
          ? processingError.message
          : "The image could not be processed. Try a different file or settings.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyOutput() {
    if (result?.text) {
      try {
        await navigator.clipboard.writeText(result.text);
        setCopied(true);
        setNotice("Copied to clipboard.");
      } catch {
        setNotice("Clipboard access is unavailable. Select the text and copy it manually.");
      }
      return;
    }
    if (pickedColor) {
      try {
        await navigator.clipboard.writeText(pickedColor);
        setCopied(true);
        setNotice(`${pickedColor} copied to clipboard.`);
      } catch {
        setNotice(`Selected color: ${pickedColor}`);
      }
    }
  }

  async function pickColor(event: React.MouseEvent<HTMLImageElement>) {
    const imageElement = previewRef.current;
    if (!imageElement || !files[0]) return;
    const bounds = imageElement.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(
        imageElement.naturalWidth - 1,
        Math.floor(((event.clientX - bounds.left) / bounds.width) * imageElement.naturalWidth),
      ),
    );
    const y = Math.max(
      0,
      Math.min(
        imageElement.naturalHeight - 1,
        Math.floor(((event.clientY - bounds.top) / bounds.height) * imageElement.naturalHeight),
      ),
    );
    try {
      const raster = await loadRaster(files[0]);
      try {
        const canvas = canvasFor(raster.width, raster.height);
        const context = getCanvasContext(canvas);
        context.drawImage(raster.image, 0, 0);
        const pixel = context.getImageData(x, y, 1, 1).data;
        const hex = `#${[pixel[0], pixel[1], pixel[2]]
          .map((channel) => channel.toString(16).padStart(2, "0"))
          .join("")}`.toUpperCase();
        setPickedColor(hex);
        setNotice(`Selected pixel at ${x}, ${y}.`);
        setCopied(false);
      } finally {
        raster.dispose();
      }
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : "Could not sample this image.");
    }
  }

  function renderSettings() {
    const keepAspectRatio = toolId !== "social-media-image-resizer";
    const widthField = (
      <>
        <label>
          Width (px)
          <input
            defaultValue={
              toolId === "social-media-image-resizer"
                ? 1080
                : toolId === "passport-photo-maker" ||
                    toolId === "signature-resizer"
                  ? 600
                  : dimensions.width || 800
            }
            min="1"
            max="8000"
            name="width"
            onChange={(event) => {
              const form = event.currentTarget.form;
              const lock = form?.elements.namedItem("keepAspectRatio");
              const heightInput = form?.elements.namedItem("height");
              if (
                lock instanceof HTMLInputElement &&
                lock.checked &&
                heightInput instanceof HTMLInputElement &&
                dimensions.width > 0
              ) {
                const nextWidth = Number(event.currentTarget.value);
                if (Number.isFinite(nextWidth) && nextWidth > 0) {
                  heightInput.value = String(
                    Math.max(1, Math.round((nextWidth / dimensions.width) * dimensions.height)),
                  );
                }
              }
            }}
            type="number"
          />
        </label>
        <label>
          Height (px)
          <input
            defaultValue={
              toolId === "social-media-image-resizer"
                ? 1080
                : toolId === "passport-photo-maker"
                  ? 800
                  : toolId === "signature-resizer"
                    ? 200
                    : dimensions.height || 800
            }
            min="1"
            max="8000"
            name="height"
            onChange={(event) => {
              const form = event.currentTarget.form;
              const lock = form?.elements.namedItem("keepAspectRatio");
              const widthInput = form?.elements.namedItem("width");
              if (
                lock instanceof HTMLInputElement &&
                lock.checked &&
                widthInput instanceof HTMLInputElement &&
                dimensions.height > 0
              ) {
                const nextHeight = Number(event.currentTarget.value);
                if (Number.isFinite(nextHeight) && nextHeight > 0) {
                  widthInput.value = String(
                    Math.max(1, Math.round((nextHeight / dimensions.height) * dimensions.width)),
                  );
                }
              }
            }}
            type="number"
          />
        </label>
      </>
    );

    if (
      [
        "image-resizer",
        "photo-resizer-by-pixels",
        "signature-resizer",
        "passport-photo-maker",
        "social-media-image-resizer",
      ].includes(toolId)
      ) {
        return (
          <>
            {toolId === "social-media-image-resizer" && (
              <label className="image-setting-wide">
                Social format
                <select
                  defaultValue="post-square"
                  name="socialPreset"
                  onChange={(event) => {
                    const presets: Record<string, [number, number]> = {
                      "post-square": [1080, 1080],
                      "portrait-post": [1080, 1350],
                      "story-reel": [1080, 1920],
                      "video-thumbnail": [1280, 720],
                      "facebook-cover": [1640, 624],
                    };
                    const form = event.currentTarget.form;
                    const [width, height] = presets[event.currentTarget.value];
                    const widthInput = form?.elements.namedItem("width");
                    const heightInput = form?.elements.namedItem("height");
                    if (
                      widthInput instanceof HTMLInputElement &&
                      heightInput instanceof HTMLInputElement
                    ) {
                      widthInput.value = String(width);
                      heightInput.value = String(height);
                    }
                  }}
                >
                  <option value="post-square">Square post · 1080 × 1080</option>
                  <option value="portrait-post">Portrait post · 1080 × 1350</option>
                  <option value="story-reel">Story / reel · 1080 × 1920</option>
                  <option value="video-thumbnail">Video thumbnail · 1280 × 720</option>
                  <option value="facebook-cover">Facebook cover · 1640 × 624</option>
                </select>
              </label>
            )}
            {widthField}
          {toolId !== "passport-photo-maker" && (
            <label className="image-setting-check image-setting-wide">
              <input
                defaultChecked={keepAspectRatio}
                name="keepAspectRatio"
                type="checkbox"
              />
              Keep original aspect ratio while editing dimensions
            </label>
          )}
          {toolId === "image-resizer" && (
            <>
              <label>
                Output format
                <select defaultValue="png" name="format">
                  <option value="png">PNG</option>
                  <option value="jpg">JPEG</option>
                  <option value="webp">WebP</option>
                </select>
              </label>
              <label>
                Quality <output htmlFor="resize-quality">85%</output>
                <input
                  defaultValue="85"
                  id="resize-quality"
                  max="100"
                  min="10"
                  name="quality"
                  onChange={(event) => {
                    const output = event.currentTarget.parentElement?.querySelector("output");
                    if (output) output.value = `${event.currentTarget.value}%`;
                  }}
                  type="range"
                />
              </label>
              <div className="image-setting-hint">Quality applies to JPEG and WebP output.</div>
            </>
          )}
          {toolId === "signature-resizer" && (
            <div className="image-setting-hint">Suggested signature size: 600 × 200 px. Adjust to the requirements of your form.</div>
          )}
          {toolId === "passport-photo-maker" && (
            <div className="image-setting-hint">The image is center-cropped to fill the output. Check official photo requirements before submitting.</div>
          )}
        </>
      );
    }
    if (toolId === "image-compressor") {
      return (
        <>
          <label className="image-setting-wide">
            JPEG quality <output htmlFor="quality">85%</output>
            <input
              defaultValue="85"
              id="quality"
              max="100"
              min="10"
              name="quality"
              onChange={(event) => {
                const output = event.currentTarget.parentElement?.querySelector("output");
                if (output) output.value = `${event.currentTarget.value}%`;
              }}
              type="range"
            />
          </label>
          <div className="image-setting-hint">Compression exports JPEG. Transparent areas are placed on white.</div>
        </>
      );
    }
    if (toolId === "photo-kb-reducer") {
      return (
        <>
          <label>
            Target size (KB)
            <input defaultValue="200" min="10" max="5000" name="targetKB" type="number" />
          </label>
          <div className="image-setting-hint">The result may not reach the target for every image. Reducing dimensions may help.</div>
        </>
      );
    }
    if (toolId === "id-photo-sheet-maker") {
      return (
        <>
          <label>Columns<input defaultValue="3" max="8" min="1" name="columns" type="number" /></label>
          <label>Rows<input defaultValue="4" max="10" min="1" name="rows" type="number" /></label>
          <label>Photo width (px)<input defaultValue="330" max="2000" min="50" name="photoWidth" type="number" /></label>
          <label>Photo height (px)<input defaultValue="390" max="2000" min="50" name="photoHeight" type="number" /></label>
          <label>Gap (px)<input defaultValue="60" max="300" min="0" name="spacing" type="number" /></label>
          <label>Page margin (px)<input defaultValue="30" max="300" min="0" name="margin" type="number" /></label>
          <div className="image-setting-hint">
            Each portrait is center-cropped to fit. The page size is calculated from your photo, gap, and margin settings.
          </div>
        </>
      );
    }
    if (toolId === "image-cropper") {
      const cropFields: [string, string, number][] = [
        ["cropX", "Left (px)", 0],
        ["cropY", "Top (px)", 0],
        ["cropWidth", "Crop width (px)", dimensions.width || 800],
        ["cropHeight", "Crop height (px)", dimensions.height || 800],
      ];
      return (
        <>
          <label className="image-setting-wide">
            Crop ratio
            <select
              defaultValue="free"
              name="cropRatio"
              onChange={(event) => {
                const ratios: Record<string, number> = {
                  square: 1,
                  "4:3": 4 / 3,
                  "3:2": 3 / 2,
                  "16:9": 16 / 9,
                  "4:5": 4 / 5,
                };
                const ratio = ratios[event.currentTarget.value];
                const form = event.currentTarget.form;
                if (!ratio || !form || !dimensions.width || !dimensions.height) return;
                let cropWidth = dimensions.width;
                let cropHeight = cropWidth / ratio;
                if (cropHeight > dimensions.height) {
                  cropHeight = dimensions.height;
                  cropWidth = cropHeight * ratio;
                }
                const values: Record<string, number> = {
                  cropX: Math.round((dimensions.width - cropWidth) / 2),
                  cropY: Math.round((dimensions.height - cropHeight) / 2),
                  cropWidth: Math.round(cropWidth),
                  cropHeight: Math.round(cropHeight),
                };
                for (const [name, value] of Object.entries(values)) {
                  const input = form.elements.namedItem(name);
                  if (input instanceof HTMLInputElement) input.value = String(value);
                }
              }}
            >
              <option value="free">Free crop</option>
              <option value="square">Square · 1:1</option>
              <option value="4:3">Landscape · 4:3</option>
              <option value="3:2">Photo · 3:2</option>
              <option value="16:9">Widescreen · 16:9</option>
              <option value="4:5">Portrait · 4:5</option>
            </select>
          </label>
          {cropFields.map(([name, label, value]) => (
            <label key={name}>
              {label}
              <input defaultValue={value} min={name === "cropWidth" || name === "cropHeight" ? 1 : 0} name={name} type="number" />
            </label>
          ))}
        </>
      );
    }
    if (toolId === "image-format-converter") {
      return (
        <label>
          Output format
          <select defaultValue="png" name="format">
            <option value="png">PNG</option>
            <option value="jpg">JPEG</option>
            <option value="webp">WebP</option>
            <option value="avif">AVIF (browser support required)</option>
          </select>
        </label>
      );
    }
    if (toolId === "image-rotator") {
      return (
        <label>
          Rotation
          <select defaultValue="90" name="rotation">
            <option value="90">90° clockwise</option>
            <option value="180">180°</option>
            <option value="270">270° clockwise</option>
          </select>
        </label>
      );
    }
    if (toolId === "image-flipper") {
      return (
        <label>
          Flip direction
          <select defaultValue="horizontal" name="direction">
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </label>
      );
    }
    if (toolId === "blur-image") {
      return (
        <label className="image-setting-wide">
          Blur radius <output htmlFor="blur">4 px</output>
          <input defaultValue="4" id="blur" max="40" min="0" name="blur" onChange={(event) => {
            const output = event.currentTarget.parentElement?.querySelector("output");
            if (output) output.value = `${event.currentTarget.value} px`;
          }} type="range" />
        </label>
      );
    }
    if (toolId === "image-brightness-adjuster" || toolId === "image-contrast-adjuster") {
      const label = toolId === "image-brightness-adjuster" ? "Brightness" : "Contrast";
      const name = toolId === "image-brightness-adjuster" ? "brightness" : "contrast";
      return (
        <label className="image-setting-wide">
          {label} <output htmlFor={name}>100%</output>
          <input defaultValue="100" id={name} max="200" min="0" name={name} onChange={(event) => {
            const output = event.currentTarget.parentElement?.querySelector("output");
            if (output) output.value = `${event.currentTarget.value}%`;
          }} type="range" />
        </label>
      );
    }
    if (toolId === "background-remover") {
      return (
        <>
          <label className="image-setting-wide">
            Color tolerance <output htmlFor="tolerance">32</output>
            <input defaultValue="32" id="tolerance" max="100" min="5" name="tolerance" onChange={(event) => {
              const output = event.currentTarget.parentElement?.querySelector("output");
              if (output) output.value = event.currentTarget.value;
            }} type="range" />
          </label>
          <div className="image-setting-hint">Uses the top-left pixel as the background reference. Works best on flat, uniform backgrounds.</div>
        </>
      );
    }
    if (toolId === "watermark-image") {
      return (
        <>
          <label className="image-setting-wide">
            Watermark text
            <input maxLength={100} name="watermark" placeholder="Your name or brand" type="text" />
          </label>
          <label className="image-setting-wide">
            Opacity <output htmlFor="opacity">55%</output>
            <input defaultValue="55" id="opacity" max="100" min="10" name="opacity" onChange={(event) => {
              const output = event.currentTarget.parentElement?.querySelector("output");
              if (output) output.value = `${event.currentTarget.value}%`;
            }} type="range" />
          </label>
        </>
      );
    }
    if (toolId === "meme-generator") {
      return (
        <>
          <label className="image-setting-wide">Top caption<input maxLength={80} name="topText" placeholder="WHEN YOU FINALLY SHIP IT" type="text" /></label>
          <label className="image-setting-wide">Bottom caption<input maxLength={80} name="bottomText" placeholder="AND THE BUILD PASSES" type="text" /></label>
        </>
      );
    }
    return null;
  }

  const fileInput = (
    <input
      accept={acceptedTypes}
      aria-label={wantsTwoImages ? "Choose portrait and signature images" : "Choose image files"}
      className="visually-hidden"
      multiple={supportsFileQueue}
      onChange={onFileChange}
      ref={inputRef}
      type="file"
    />
  );
  const hasSettings =
    ![
      "image-dpi-checker",
      "image-to-base64",
      "base64-to-image",
      "image-to-pdf",
      "multiple-images-to-pdf",
      "photo-signature-combiner",
      "image-color-picker",
      "image-palette-extractor",
      "image-to-ascii-art",
      "qr-image-scanner",
      "exif-metadata-remover",
      "heic-converter",
      "tiff-converter",
      "svg-to-png",
      "png-to-ico",
    ].includes(toolId);

  return (
    <div className="image-tool-layout">
      <section className="image-tool-workspace" aria-label={`${imageToolIntros[toolId]} workspace`}>
        <div className="image-tool-panel">
          <div className="image-tool-panel-heading">
            <div>
              <h2>
                {wantsBase64
                  ? "Image data URL"
                  : files.length
                    ? files.length === 1
                      ? "Your image"
                      : "Your images"
                    : "Choose your image"}
              </h2>
              <p>
                {supportsMultiple
                  ? `Up to ${MAX_BATCH_FILES} images · 20 MB each`
                  : wantsTwoImages
                  ? "Portrait first, signature second · reorder below if needed"
                    : "JPG, PNG, WebP, AVIF, SVG, HEIC, TIFF · up to 20 MB"}
              </p>
            </div>
            <button className="tool-quiet-button" disabled={!files.length && !base64Input} onClick={reset} type="button">
              <RotateCcw size={15} aria-hidden="true" />
              Reset
            </button>
          </div>
          {wantsBase64 ? (
            <label className="image-data-label" htmlFor="base64-image-input">
              Paste a supported image data URL
              <textarea
                className="image-tool-textarea"
                id="base64-image-input"
                onChange={(event) => setBase64Input(event.target.value)}
                placeholder="data:image/png;base64,…"
                value={base64Input}
              />
            </label>
          ) : (
            <div
              className={`image-dropzone${dragging ? " image-dropzone-active" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDragging(false);
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
            >
              {fileInput}
              <span className="image-dropzone-icon"><ImagePlus size={22} aria-hidden="true" /></span>
              <strong>{files.length ? `${files.length} image${files.length === 1 ? "" : "s"} selected` : "Drop your image here"}</strong>
              <span>or</span>
              <button className="secondary-button" onClick={() => inputRef.current?.click()} type="button">
                <Upload size={15} aria-hidden="true" />
                {supportsFileQueue && files.length > 0 ? "Add more images" : "Browse files"}
              </button>
              {files.length > 0 && (
                <ul className="image-file-list" aria-label="Selected files">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`}>
                      <span className="image-file-index">{String(index + 1).padStart(2, "0")}</span>
                      <span className="image-file-name" title={file.name}>{file.name}</span>
                      <small>{formatBytes(file.size)}</small>
                      {supportsFileQueue && (
                        <span className="image-file-actions">
                          <button
                            aria-label={`Move ${file.name} up`}
                            disabled={index === 0}
                            onClick={() => moveFile(index, -1)}
                            type="button"
                          >
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
                        onClick={() => removeFile(index)}
                        type="button"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {wantsTwoImages && (
            <div className="image-setting-hint">
              Select two images in order: portrait first, signature second.
            </div>
          )}
          {dimensions.width > 0 && (
            <div className="image-source-info">
              Original: {dimensions.width.toLocaleString()} × {dimensions.height.toLocaleString()} px
              {files[0] && <> · {formatBytes(files[0].size)}</>}
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="image-preview-panel">
            <div className="image-tool-panel-heading">
              <div>
                <h2>{supportsMultiple ? "First page preview" : "Preview"}</h2>
                <p>{supportsMultiple ? `Page 1 of ${files.length} · reorder images above` : "Original image"}</p>
              </div>
              {toolId === "image-color-picker" && <span className="image-setting-hint">Click a pixel to sample its color</span>}
            </div>
            {sourcePreviewUrl ? (
              <div className="image-preview-stage">
                <img
                  alt={`Preview of ${files[0].name}`}
                  className={toolId === "image-color-picker" ? "image-color-preview" : "image-preview"}
                  onClick={toolId === "image-color-picker" ? (event) => void pickColor(event) : undefined}
                  ref={previewRef}
                  src={sourcePreviewUrl}
                />
              </div>
            ) : (
              <div className="image-preview-placeholder" role="status">Preparing preview…</div>
            )}
            {pickedColor && (
              <div className="image-color-result">
                <span className="color-swatch" style={{ backgroundColor: pickedColor }} />
                <strong>{pickedColor}</strong>
                <button className="tool-quiet-button" onClick={() => void copyOutput()} type="button">
                  {copied ? <Check size={14} /> : <Clipboard size={14} />} Copy color
                </button>
              </div>
            )}
          </div>
        )}

        {hasSettings && (
          <form
            className="image-tool-panel image-settings"
            key={`${toolId}-${dimensions.width}-${dimensions.height}`}
            onSubmit={(event) => void processImage(event)}
            ref={settingsRef}
          >
            <div className="image-tool-panel-heading">
              <div><h2>Output settings</h2></div>
            </div>
            <div className="image-settings-grid">{renderSettings()}</div>
            <button className="button-primary image-process-button" disabled={!files.length || busy} type="submit">
              {busy ? <span className="image-spinner" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
              {busy ? "Processing in your browser…" : "Process image"}
            </button>
          </form>
        )}
        {!hasSettings && toolId !== "image-color-picker" && (
          <form
            className="image-tool-action-row"
            onSubmit={(event) => void processImage(event)}
            ref={settingsRef}
          >
            <button
              className="button-primary image-process-button"
              disabled={
                busy ||
                (!files.length && !wantsBase64) ||
                (wantsBase64 && !base64Input) ||
                (wantsTwoImages && files.length < 2)
              }
              type="submit"
            >
              {busy ? <span className="image-spinner" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
              {busy ? "Processing in your browser…" : "Process image"}
            </button>
          </form>
        )}

        {error && <p className="image-error" role="alert">{error}</p>}
        {notice && <p className="image-notice" aria-live="polite" role="status">{notice}</p>}

        {result && (
          <div className="image-result-panel" aria-live="polite">
            <div className="image-tool-panel-heading">
              <div>
                <h2>{result.text ? "Result" : result.details?.startsWith("Image dimensions") ? "Image details" : "Your image is ready"}</h2>
                {result.details && <p>{result.details.split("\n")[0]}</p>}
              </div>
              {result.blob && (
                <button className="button-primary image-download-button" onClick={() => void downloadBlob(result.blob!, result.filename ?? "image.png")} type="button">
                  <Download size={15} aria-hidden="true" /> Download
                </button>
              )}
              {result.text && (
                <button className="secondary-button" onClick={() => void copyOutput()} type="button">
                  {copied ? <Check size={15} /> : <Clipboard size={15} />} {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            {result.blob && previewUrl && (
              <div className="image-preview-stage image-output-stage">
                <img alt="Processed image preview" className="image-preview" src={previewUrl} />
              </div>
            )}
            {result.text && <pre className="image-text-result">{result.text}</pre>}
            {result.details?.includes("\n") && <pre className="image-detail-text">{result.details}</pre>}
            {result.filename && result.blob && (
              <p className="image-result-meta">
                {result.filename} · {formatBytes(result.blob.size)}
              </p>
            )}
          </div>
        )}
      </section>

      <aside className="image-tool-aside">
        <div className="tool-info-card">
          <span className="tool-info-icon"><ShieldCheck size={17} aria-hidden="true" /></span>
          <h2>Private processing</h2>
          <p>Images stay on your device and are processed in your browser.</p>
        </div>
        <p className="tool-limitation">
          Max file size: 20 MB · Max image size: 40 megapixels. Format support varies by browser.
        </p>
      </aside>
    </div>
  );
}
