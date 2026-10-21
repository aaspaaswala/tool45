export const developerToolDefinitions = {
  "json-formatter": { title: "JSON Formatter", intro: "Format and validate JSON with readable indentation." },
  "json-validator": { title: "JSON Validator", intro: "Check JSON syntax and see clear validation errors." },
  "xml-formatter": { title: "XML Formatter", intro: "Format XML with readable indentation in your browser." },
  "html-formatter": { title: "HTML Formatter", intro: "Format HTML markup for easier inspection." },
  "css-minifier": { title: "CSS Minifier", intro: "Remove comments and unnecessary whitespace from CSS." },
  "javascript-minifier": { title: "JavaScript Minifier", intro: "Remove comments and repeated horizontal whitespace while preserving line breaks and string contents." },
  "sql-formatter": { title: "SQL Formatter", intro: "Format common SQL clauses and indentation for easier reading." },
  "base64-encoder": { title: "Base64 Encoder", intro: "Encode UTF-8 text as Base64 in your browser." },
  "base64-decoder": { title: "Base64 Decoder", intro: "Decode Base64 text as UTF-8 in your browser." },
  "url-encoder": { title: "URL Encoder", intro: "Percent-encode text for safe use as a URL component." },
  "url-decoder": { title: "URL Decoder", intro: "Decode percent-encoded URL text." },
  "html-entity-converter": { title: "HTML Entity Converter", intro: "Encode special characters as HTML entities or decode entities to text." },
  "regex-tester": { title: "Regex Tester", intro: "Test a JavaScript regular expression against sample text." },
  "uuid-generator": { title: "UUID Generator", intro: "Generate random UUID v4 identifiers in your browser." },
  "hash-generator": { title: "Hash Generator", intro: "Calculate SHA-1, SHA-256, SHA-384, or SHA-512 digests locally." },
  "jwt-decoder": { title: "JWT Decoder", intro: "Inspect the header and payload of a JWT without verifying it." },
  "timestamp-converter": { title: "Timestamp Converter", intro: "Convert Unix timestamps and local dates in both directions." },
  "yaml-to-json": { title: "YAML to JSON", intro: "Convert a safe subset of YAML mappings, lists, and scalars to JSON." },
  "markdown-to-html": { title: "Markdown to HTML", intro: "Convert basic Markdown to escaped HTML in your browser." },
  "qr-code-generator": { title: "QR Code Generator", intro: "Create and download a QR code for text or a URL." },
  "json-to-csv": { title: "JSON to CSV", intro: "Convert an array of JSON objects to quoted CSV." },
  "csv-to-json": { title: "CSV to JSON", intro: "Convert quoted CSV rows to a JSON array of objects." },
  "cron-expression-generator": { title: "Cron Expression Generator", intro: "Build a standard five-field cron expression with a readable summary." },
  "diff-checker": { title: "Diff Checker", intro: "Compare two text blocks and inspect added and removed lines." },
  "code-syntax-highlighter": { title: "Code Syntax Highlighter", intro: "Inspect code with safe, escaped output and line numbers." },
} as const;

export type DeveloperToolId = keyof typeof developerToolDefinitions;

export const developerToolIds = Object.keys(
  developerToolDefinitions,
) as DeveloperToolId[];

export function isDeveloperToolId(id: string): id is DeveloperToolId {
  return Object.hasOwn(developerToolDefinitions, id);
}
