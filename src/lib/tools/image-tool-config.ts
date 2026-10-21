export const imageToolIds = [
  "image-resizer",
  "image-compressor",
  "image-cropper",
  "image-format-converter",
  "jpg-to-png",
  "png-to-jpg",
  "webp-to-jpg",
  "jpg-to-webp",
  "png-to-webp",
  "avif-converter",
  "background-remover",
  "passport-photo-maker",
  "signature-resizer",
  "photo-kb-reducer",
  "image-dpi-checker",
  "image-to-base64",
  "base64-to-image",
  "image-to-pdf",
  "watermark-image",
  "blur-image",
  "image-rotator",
  "image-flipper",
  "image-color-picker",
  "favicon-generator",
  "meme-generator",
  "photo-signature-combiner",
  "photo-resizer-by-pixels",
  "image-to-grayscale",
  "image-color-inverter",
  "image-brightness-adjuster",
  "image-contrast-adjuster",
  "image-to-ascii-art",
  "image-palette-extractor",
  "heic-converter",
  "tiff-converter",
  "svg-to-png",
  "png-to-ico",
  "qr-image-scanner",
  "exif-metadata-remover",
  "id-photo-sheet-maker",
  "multiple-images-to-pdf",
  "social-media-image-resizer",
] as const;

export type ImageToolId = (typeof imageToolIds)[number];

export function isImageToolId(id: string): id is ImageToolId {
  return imageToolIds.some((imageToolId) => imageToolId === id);
}

export const imageToolIntros: Record<ImageToolId, string> = {
  "image-resizer":
    "Resize images to exact pixel dimensions and download the result.",
  "image-compressor":
    "Adjust JPEG quality and compare the original and output file sizes before downloading.",
  "image-cropper":
    "Crop by pixel coordinates or choose a common aspect ratio, then preview the result before saving.",
  "image-format-converter":
    "Convert an image to PNG, JPEG, or WebP when your browser supports the selected format.",
  "jpg-to-png":
    "Convert a JPEG image to PNG in your browser while preserving its visible dimensions.",
  "png-to-jpg":
    "Convert a PNG image to JPEG. Transparent pixels are composited onto a white background.",
  "webp-to-jpg":
    "Convert a WebP image to a JPEG file in your browser.",
  "jpg-to-webp":
    "Convert a JPEG image to WebP in your browser.",
  "png-to-webp":
    "Convert a PNG image to WebP in your browser.",
  "avif-converter":
    "Convert to AVIF if the browser on this device supports AVIF encoding.",
  "background-remover":
    "Make a near-uniform background transparent using a color tolerance. This is not AI subject selection.",
  "passport-photo-maker":
    "Center-crop an image to a portrait photo and choose printable pixel dimensions.",
  "signature-resizer":
    "Resize a signature image using practical width and height controls.",
  "photo-kb-reducer":
    "Find a JPEG quality close to a target file size. Some images cannot reach the requested size without substantial quality loss.",
  "image-dpi-checker":
    "Inspect pixel dimensions and available density metadata. Pixel size is exact; print-size estimates use 300 DPI.",
  "image-to-base64":
    "Convert an image to a Base64 data URL and copy it to your clipboard.",
  "base64-to-image":
    "Preview a supported image data URL and download it as a file.",
  "image-to-pdf":
    "Create a one-page PDF from an image. Image pixels are placed on a matching page.",
  "watermark-image":
    "Add your own text over an image. Only use images you have rights to edit.",
  "blur-image":
    "Adjust the blur radius and preview a blurred image.",
  "image-rotator":
    "Rotate an image clockwise in quarter-turn steps.",
  "image-flipper":
    "Flip an image horizontally or vertically.",
  "image-color-picker":
    "Click a pixel in the image preview to inspect and copy its color value.",
  "favicon-generator":
    "Create a square 32 × 32 PNG favicon from an image.",
  "meme-generator":
    "Add top and bottom captions to an image, then download the result.",
  "photo-signature-combiner":
    "Combine a portrait and a separate signature image into a single file.",
  "photo-resizer-by-pixels":
    "Enter exact pixel dimensions for your image output.",
  "image-to-grayscale":
    "Convert an image to grayscale in your browser.",
  "image-color-inverter":
    "Invert the RGB color channels in an image.",
  "image-brightness-adjuster":
    "Adjust brightness and preview the exported image.",
  "image-contrast-adjuster":
    "Adjust contrast and preview the exported image.",
  "image-to-ascii-art":
    "Create a text-based ASCII approximation of a small image.",
  "image-palette-extractor":
    "Sample image pixels and list the most frequent colors.",
  "heic-converter":
    "Decode a HEIC/HEIF photo in your browser and convert it to JPEG.",
  "tiff-converter":
    "Decode a TIFF image in your browser and convert it to PNG.",
  "svg-to-png":
    "Rasterize a local SVG file as PNG. Active content and external references are removed.",
  "png-to-ico":
    "Wrap a PNG image in a Windows ICO container.",
  "qr-image-scanner":
    "Look for a QR code in an uploaded image, using a browser-side decoder.",
  "exif-metadata-remover":
    "Re-encode an image to strip embedded metadata. The image pixels are retained.",
  "id-photo-sheet-maker":
    "Build a photo sheet with adjustable rows, columns, photo dimensions, spacing, and margins.",
  "multiple-images-to-pdf":
    "Create a PDF with one image per page, processed on your device.",
  "social-media-image-resizer":
    "Resize images for common social formats such as posts, stories, and thumbnails.",
};
