export const MAX_IMAGE_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 40_000_000;

export interface RasterImage {
  image: HTMLImageElement;
  width: number;
  height: number;
  dispose: () => void;
}

export function validateImageFile(file: File): string | null {
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return "Choose an image smaller than 20 MB.";
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const supportedExtensions = [
    "jpg", "jpeg", "png", "webp", "avif", "gif", "bmp", "svg", "heic",
    "heif", "tif", "tiff",
  ];
  if (!supportedExtensions.includes(extension ?? "")) {
    return "Choose a JPG, PNG, WebP, AVIF, GIF, BMP, SVG, HEIC, or TIFF file.";
  }

  return null;
}

function sanitizeSvg(svgText: string): string {
  const document = new DOMParser().parseFromString(svgText, "image/svg+xml");
  if (
    document.querySelector("parsererror") ||
    document.documentElement.localName !== "svg"
  ) {
    throw new Error("This SVG file is malformed.");
  }

  for (const element of document.querySelectorAll(
    "script, style, foreignObject, iframe, object, embed, image",
  )) {
    element.remove();
  }
  for (const element of document.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (
        name.startsWith("on") ||
        value.includes("url(") ||
        ((name === "href" || name.endsWith(":href")) &&
          value &&
          !value.startsWith("#") &&
          !value.startsWith("data:image/"))
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  return new XMLSerializer().serializeToString(document.documentElement);
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              `This browser could not create ${type}. Try PNG or JPEG instead.`,
            ),
          );
          return;
        }
        if (blob.type !== type) {
          reject(
            new Error(
              `${type} encoding is not supported by this browser. Try PNG, JPEG, or WebP.`,
            ),
          );
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function decodeTiff(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The TIFF file could not be read."));
    reader.onload = async () => {
      try {
        const UTIF = await import("utif");
        const buffer = reader.result;
        if (!(buffer instanceof ArrayBuffer)) {
          throw new Error("The TIFF file could not be read.");
        }
        const pages = UTIF.decode(buffer);
        const firstPage = pages[0];
        if (!firstPage) throw new Error("This TIFF contains no image pages.");
        UTIF.decodeImage(buffer, firstPage);
        const rgba = UTIF.toRGBA8(firstPage);
        const canvas = document.createElement("canvas");
        canvas.width = firstPage.width;
        canvas.height = firstPage.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Image canvas is unavailable.");
        context.putImageData(
          new ImageData(
            new Uint8ClampedArray(rgba),
            firstPage.width,
            firstPage.height,
          ),
          0,
          0,
        );
        resolve(canvas);
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("This TIFF image could not be decoded."),
        );
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

async function prepareImageFile(file: File): Promise<Blob> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "heic" || extension === "heif") {
    try {
      const converter = await import("heic2any");
      const converted = await converter.default({
        blob: file,
        toType: "image/jpeg",
        quality: 0.95,
      });
      return Array.isArray(converted) ? converted[0] : converted;
    } catch {
      throw new Error(
        "This HEIC image could not be decoded. Try another photo or convert it to JPEG on your device.",
      );
    }
  }
  if (extension === "tif" || extension === "tiff") {
    const canvas = await decodeTiff(file);
    return toBlob(canvas, "image/png");
  }
  if (extension === "svg") {
    const sanitized = sanitizeSvg(await file.text());
    return new Blob([sanitized], { type: "image/svg+xml" });
  }
  return file;
}

export async function loadRaster(file: File): Promise<RasterImage> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const prepared = await prepareImageFile(file);
  const url = URL.createObjectURL(prepared);
  const image = new Image();
  image.decoding = "async";

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(
          new Error(
            "This image could not be decoded. Check that the file is valid and try again.",
          ),
        );
      image.src = url;
    });
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }

  if (!image.naturalWidth || !image.naturalHeight) {
    URL.revokeObjectURL(url);
    throw new Error("This image has no readable pixel dimensions.");
  }
  if (image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) {
    URL.revokeObjectURL(url);
    throw new Error("This image is larger than the 40-megapixel processing limit.");
  }

  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    dispose: () => URL.revokeObjectURL(url),
  };
}

export function canvasFor(width: number, height: number): HTMLCanvasElement {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new Error("Output dimensions must be between 1 pixel and 40 megapixels.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  return canvas;
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality?: number,
): Promise<Blob> {
  return toBlob(canvas, type, quality);
}

export async function readDpiMetadata(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    for (let offset = 8; offset + 20 <= bytes.length; ) {
      const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
      const length =
        bytes[offset] * 0x1000000 +
        (bytes[offset + 1] << 16) +
        (bytes[offset + 2] << 8) +
        bytes[offset + 3];
      if (offset + 12 + length > bytes.length) break;
      if (type === "pHYs" && length >= 9 && bytes[offset + 16] === 1) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const xDpi = (view.getUint32(offset + 8) * 0.0254).toFixed(1);
        const yDpi = (view.getUint32(offset + 12) * 0.0254).toFixed(1);
        return `PNG density metadata: ${xDpi} × ${yDpi} DPI`;
      }
      offset += 12 + length;
    }
    return "PNG density metadata: not embedded";
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    for (let offset = 2; offset + 4 < bytes.length; ) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (length < 2 || offset + 2 + length > bytes.length) break;
      const data = offset + 4;
      if (
        marker === 0xe0 &&
        length >= 16 &&
        String.fromCharCode(...bytes.slice(data, data + 5)) === "JFIF\u0000"
      ) {
        const unit = bytes[data + 7];
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        let xDpi = view.getUint16(data + 8);
        let yDpi = view.getUint16(data + 10);
        if (unit === 2) {
          xDpi *= 2.54;
          yDpi *= 2.54;
        }
        if (unit !== 0) {
          return `JPEG JFIF density metadata: ${xDpi.toFixed(1)} × ${yDpi.toFixed(1)} DPI`;
        }
      }
      offset += 2 + length;
    }
    return "JPEG density metadata: not embedded";
  }

  return "This format does not expose a supported DPI field in this checker.";
}

export function imageDataUrlToFile(dataUrl: string): File {
  const match = dataUrl.trim().match(
    /^data:(image\/(?:png|jpeg|webp|gif|avif|bmp));base64,([a-z0-9+/=\s]+)$/i,
  );
  if (!match) {
    throw new Error(
      "Paste a valid Base64 data URL for PNG, JPEG, WebP, GIF, AVIF, or BMP.",
    );
  }
  const encoded = match[2].replace(/\s/gu, "");
  if (encoded.length > MAX_IMAGE_FILE_BYTES * 1.4) {
    throw new Error("The decoded image must be smaller than 20 MB.");
  }
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );
  if (bytes.byteLength > MAX_IMAGE_FILE_BYTES) {
    throw new Error("The decoded image must be smaller than 20 MB.");
  }
  const type = match[1].toLowerCase();
  const extension = type.split("/")[1].replace("jpeg", "jpg");
  return new File([bytes], `image.${extension}`, { type });
}

export async function downloadBlob(
  blob: Blob,
  filename: string,
): Promise<void> {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getImageExtension(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "png";
  return extension === "jpeg" ? "jpg" : extension;
}

export function getMimeForFormat(format: string): string {
  return format === "jpg" ? "image/jpeg" : `image/${format}`;
}

export function fileNameWithoutExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/u, "");
}

export function getCanvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image canvas is unavailable in this browser.");
  return context;
}
