export const pdfToolIds = [
  "merge-pdf",
  "split-pdf",
  "rotate-pdf",
  "delete-pdf-pages",
  "pdf-page-extractor",
  "pdf-page-organizer",
  "add-pdf-page-numbers",
  "watermark-pdf",
  "pdf-metadata-viewer",
  "pdf-metadata-editor",
  "pdf-page-size-checker",
  "pdf-print-size-checker",
  "compare-pdfs",
  "pdf-form-filler",
  "repair-pdf",
  "pdf-compressor",
  "pdf-to-text",
  "pdf-text-extractor",
  "pdf-to-html",
  "pdf-to-markdown",
  "pdf-to-jpg",
  "pdf-to-png",
  "jpg-to-pdf",
] as const;

export type PdfToolId = (typeof pdfToolIds)[number];

export function isPdfToolId(id: string): id is PdfToolId {
  return pdfToolIds.some((pdfToolId) => pdfToolId === id);
}

export const pdfToolIntros: Record<PdfToolId, string> = {
  "merge-pdf":
    "Combine several PDF files into one document in the order you choose.",
  "split-pdf":
    "Split a PDF into single pages or custom page ranges and download them together.",
  "rotate-pdf": "Rotate every page, or only selected pages, by 90, 180 or 270 degrees.",
  "delete-pdf-pages": "Remove unwanted pages from a PDF and save the rest.",
  "pdf-page-extractor": "Pull selected pages out of a PDF into a new document.",
  "pdf-page-organizer":
    "Reorder, duplicate or drop pages by listing them in the order you want.",
  "add-pdf-page-numbers":
    "Stamp page numbers on every page with your choice of position and format.",
  "watermark-pdf": "Add a diagonal or horizontal text watermark to every page.",
  "pdf-metadata-viewer":
    "Inspect a PDF's title, author, dates, page count and other document properties.",
  "pdf-metadata-editor":
    "Edit a PDF's title, author, subject, keywords and creator fields.",
  "pdf-page-size-checker":
    "Check the exact dimensions, paper size and orientation of every page.",
  "pdf-print-size-checker":
    "See print dimensions in millimetres and inches and which paper sizes each page fits.",
  "compare-pdfs":
    "Compare the text of two PDFs page by page and see what differs.",
  "pdf-form-filler": "Fill in the form fields of a fillable PDF and download the result.",
  "repair-pdf":
    "Try to rebuild a damaged PDF by re-reading its pages into a clean file.",
  "pdf-compressor":
    "Shrink a PDF by re-rendering its pages as compressed images at a quality you choose.",
  "pdf-to-text": "Extract the text from a PDF and copy or download it as a .txt file.",
  "pdf-text-extractor":
    "Extract the text layer of a PDF page by page, ready to copy or download.",
  "pdf-to-html": "Convert the text of a PDF into a simple HTML document.",
  "pdf-to-markdown": "Convert the text of a PDF into a Markdown document.",
  "pdf-to-jpg": "Render PDF pages as JPG images and download them as a ZIP.",
  "pdf-to-png": "Render PDF pages as PNG images and download them as a ZIP.",
  "jpg-to-pdf": "Turn JPG, PNG or WebP images into one PDF, one image per page.",
};

export const pdfMultiFileTools: ReadonlySet<PdfToolId> = new Set([
  "merge-pdf",
  "jpg-to-pdf",
]);

export const pdfImageInputTools: ReadonlySet<PdfToolId> = new Set(["jpg-to-pdf"]);
