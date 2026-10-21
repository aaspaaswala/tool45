"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import QRCode from "qrcode";

import {
  developerToolDefinitions,
  type DeveloperToolId,
} from "@/lib/tools/developer-tool-config";

type DiffLine = { kind: "same" | "added" | "removed"; text: string };
type CronState = { minute: string; hour: string; day: string; month: string; weekday: string };

function minifyCss(source: string): string {
  let result = "";
  let quote = "";
  let pendingSpace = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      result += char;
      if (char === "\\" && index + 1 < source.length) result += source[++index];
      else if (char === quote) quote = "";
      continue;
    }
    if ((char === '"' || char === "'")) {
      if (pendingSpace && /[\w#.)%]/u.test(result.at(-1) ?? "") && /[\w#.(%]/u.test(char)) result += " ";
      pendingSpace = false;
      quote = char;
      result += char;
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) index += 1;
      if (index < source.length) index += 1;
      pendingSpace = true;
      continue;
    }
    if (/\s/u.test(char)) {
      pendingSpace = true;
      continue;
    }
    if (pendingSpace) {
      const previous = result.at(-1) ?? "";
      if (previous === "+" || previous === "-" || previous === "~" || char === "+" || char === "-" || char === "~" ||
          (/[\w#.)%]/u.test(previous) && /[\w#.(%]/u.test(char))) result += " ";
      pendingSpace = false;
    }
    if (/[\{\}:;,>]/u.test(char)) result = result.replace(/\s+$/u, "");
    result += char;
  }
  return result.replace(/;\}/gu, "}").trim();
}

function minifyJavaScriptComments(source: string): string {
  let result = "";
  let quote = "";
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      result += char;
      if (char === "\\" && index + 1 < source.length) result += source[++index];
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      result += char;
      continue;
    }
    if (char === "/" && source[index + 1] === "/") {
      while (index < source.length && source[index] !== "\n" && source[index] !== "\r") index += 1;
      if (index < source.length) result += source[index];
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) index += 1;
      if (index < source.length) index += 1;
      const previous = result.at(-1) ?? "";
      const next = source[index + 1] ?? "";
      if (/[\w$]/u.test(previous) && /[\w$]/u.test(next)) result += " ";
      continue;
    }
    result += char;
  }
  return result.replace(/[ \t]+/gu, " ").trim();
}

const keywords = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "class", "new", "this", "import", "from", "export", "default", "async",
  "await", "try", "catch", "throw", "switch", "case", "break", "continue",
  "true", "false", "null", "undefined", "interface", "type", "extends",
  "public", "private", "static", "void", "SELECT", "FROM", "WHERE", "AND",
  "OR", "JOIN", "ON", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
  "CREATE", "TABLE", "ORDER", "BY", "GROUP", "LIMIT", "AS", "DISTINCT",
]);

function prettyMarkup(source: string): string {
  const tokens = source.replace(/>\s+</gu, "><").match(/<[^>]+>|[^<]+/gu) ?? [];
  let depth = 0;
  const lines: string[] = [];
  for (const token of tokens) {
    const value = token.trim();
    if (!value) continue;
    const closes = /^<\//u.test(value);
    const opens = /^<[^!?/][^>]*[^/]?>$/u.test(value) && !/^<[^>]+\/>$/u.test(value);
    if (closes) depth = Math.max(0, depth - 1);
    lines.push(`${"  ".repeat(depth)}${value}`);
    if (opens && !/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/iu.test(value)) {
      depth += 1;
    }
  }
  return lines.join("\n");
}

function formatXml(source: string): string {
  const document = new DOMParser().parseFromString(source, "application/xml");
  const error = document.querySelector("parsererror");
  if (error) throw new Error(error.textContent?.trim() || "Invalid XML.");
  return prettyMarkup(new XMLSerializer().serializeToString(document));
}

function formatHtml(source: string): string {
  const document = new DOMParser().parseFromString(source, "text/html");
  return prettyMarkup(`<!doctype html>\n${document.documentElement.outerHTML}`);
}

function csvParse(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let quoteClosed = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
        quoteClosed = true;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell.length === 0) {
      quoted = true;
    } else if (char === '"' || (quoteClosed && char !== "," && char !== "\n" && char !== "\r")) {
      throw new Error("Unexpected character in CSV field.");
    } else if (char === ",") {
      row.push(cell);
      cell = "";
      quoteClosed = false;
    } else if (char === "\n" || char === "\r") {
      row.push(cell);
      if (row.some((entry) => entry.length > 0) || char === "\n") rows.push(row);
      row = [];
      cell = "";
      quoteClosed = false;
      if (char === "\r" && source[index + 1] === "\n") index += 1;
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined
    ? ""
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replace(/"/gu, '""')}"` : text;
}

function convertYamlScalar(value: string): unknown {
  const text = value.trim();
  if (!text) return null;
  if (/^(null|~)$/iu.test(text)) return null;
  if (/^(true|false)$/iu.test(text)) return text.toLowerCase() === "true";
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/u.test(text)) return Number(text);
  if (text.startsWith('"')) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error(`Invalid quoted string: ${text}`);
    }
  }
  if (text.startsWith("'") && text.endsWith("'") && text.length >= 2) {
    return text.slice(1, -1).replace(/''/gu, "'");
  }
  if (text.startsWith("[") || text.startsWith("{") || /[&*!|>]/u.test(text)) {
    throw new Error("This converter supports block YAML and plain/quoted scalars, not flow collections, tags, anchors, or block scalars.");
  }
  return text;
}

function parseYaml(source: string): unknown {
  const lines = source.split(/\r?\n/u)
    .map((raw, index) => ({ raw, line: index + 1 }))
    .filter(({ raw }) => raw.trim() && !raw.trimStart().startsWith("#") && raw.trim() !== "---" && raw.trim() !== "...");
  if (!lines.length) return null;
  const parseBlock = (start: number, indent: number): { value: unknown; next: number } => {
    const isList = lines[start]?.raw.trimStart().startsWith("- ");
    const object: Record<string, unknown> = {};
    const list: unknown[] = [];
    let index = start;
    while (index < lines.length) {
      const { raw, line } = lines[index];
      const currentIndent = raw.length - raw.trimStart().length;
      if (currentIndent < indent) break;
      if (currentIndent > indent) throw new Error(`Unexpected indentation on line ${line}.`);
      const content = raw.trim();
      if (isList) {
        if (!content.startsWith("- ") && content !== "-") throw new Error(`Expected a list item on line ${line}.`);
        const item = content.slice(1).trim();
        if (!item) {
          if (index + 1 >= lines.length || lines[index + 1].raw.length - lines[index + 1].raw.trimStart().length <= indent) {
            list.push(null);
            index += 1;
          } else {
            const nested = parseBlock(index + 1, lines[index + 1].raw.length - lines[index + 1].raw.trimStart().length);
            list.push(nested.value);
            index = nested.next;
          }
        } else {
          list.push(convertYamlScalar(item));
          index += 1;
        }
      } else {
        const match = /^((?:"(?:[^"\\]|\\.)+"|'(?:[^']|'')+'|[^:#][^:]*)):\s*(.*)$/u.exec(content);
        if (!match) throw new Error(`Expected a key: value mapping on line ${line}.`);
        const key = String(convertYamlScalar(match[1]));
        if (Object.hasOwn(object, key)) throw new Error(`Duplicate key "${key}" on line ${line}.`);
        const value = match[2];
        if (value) {
          object[key] = convertYamlScalar(value);
          index += 1;
        } else if (index + 1 < lines.length && lines[index + 1].raw.length - lines[index + 1].raw.trimStart().length > indent) {
          const nested = parseBlock(index + 1, lines[index + 1].raw.length - lines[index + 1].raw.trimStart().length);
          object[key] = nested.value;
          index = nested.next;
        } else {
          object[key] = null;
          index += 1;
        }
      }
    }
    return { value: isList ? list : object, next: index };
  };
  const firstIndent = lines[0].raw.length - lines[0].raw.trimStart().length;
  const parsed = parseBlock(0, firstIndent);
  if (parsed.next !== lines.length) throw new Error(`Could not parse line ${lines[parsed.next].line}.`);
  return parsed.value;
}

function markdownHtml(source: string): string {
  const escape = (text: string) =>
    text.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;").replace(/"/gu, "&quot;").replace(/'/gu, "&#39;");
  const inline = (text: string) => escape(text)
    .replace(/`([^`]+)`/gu, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/gu, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gu, '<a href="$2" rel="noreferrer">$1</a>');
  return source.replace(/\r\n?/gu, "\n").split("\n\n").map((block) => {
    const heading = /^(#{1,6})\s+(.+)$/u.exec(block.trim());
    if (heading) {
      const level = heading[1].length;
      return `<h${level}>${inline(heading[2])}</h${level}>`;
    }
    const items = block.split("\n").map((line) => /^\s*[-*]\s+(.+)$/u.exec(line));
    if (items.every(Boolean)) return `<ul>${items.map((item) => `<li>${inline(item![1])}</li>`).join("")}</ul>`;
    return `<p>${inline(block.replace(/\n/gu, " "))}</p>`;
  }).join("\n");
}

function diffText(left: string, right: string): DiffLine[] {
  const a = left.replace(/\r\n?/gu, "\n").split("\n");
  const b = right.replace(/\r\n?/gu, "\n").split("\n");
  if (a.length * b.length > 250_000) throw new Error("The diff is too large. Compare fewer than 250,000 line pairs.");
  const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ kind: "same", text: a[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      result.push({ kind: "removed", text: a[i++] });
    } else {
      result.push({ kind: "added", text: b[j++] });
    }
  }
  while (i < a.length) result.push({ kind: "removed", text: a[i++] });
  while (j < b.length) result.push({ kind: "added", text: b[j++] });
  return result;
}

function highlighter(source: string): ReactNode[] {
  const pattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|--[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/gu;
  const result: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) result.push(source.slice(lastIndex, index));
    const token = match[0];
    const className = /^(\/\/|\/\*|--)/u.test(token)
      ? "developer-token-comment"
      : /^(["'`])/u.test(token)
        ? "developer-token-string"
        : /^\d/u.test(token)
          ? "developer-token-number"
          : keywords.has(token) || keywords.has(token.toUpperCase())
            ? "developer-token-keyword"
            : "";
    result.push(className ? <span className={className} key={index}>{token}</span> : token);
    lastIndex = index + token.length;
  }
  if (lastIndex < source.length) result.push(source.slice(lastIndex));
  return result;
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/gu, "+").replace(/_/gu, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

function isoFromTimestamp(value: string, unit: "seconds" | "milliseconds"): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  const date = new Date(unit === "seconds" ? parsed * 1000 : parsed);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function timestampFromIso(value: string, unit: "seconds" | "milliseconds"): string {
  const parsed = new Date(value).getTime();
  if (!Number.isFinite(parsed)) return "";
  return String(unit === "seconds" ? Math.floor(parsed / 1000) : parsed);
}

function downloadText(content: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DeveloperTool({ toolId }: { toolId: DeveloperToolId }) {
  const [input, setInput] = useState("");
  const [secondInput, setSecondInput] = useState("");
  const [output, setOutput] = useState("");
  const [entityMode, setEntityMode] = useState<"encode" | "decode">("decode");
  const [flagGlobal, setFlagGlobal] = useState(true);
  const [flagIgnoreCase, setFlagIgnoreCase] = useState(false);
  const [flagMultiline, setFlagMultiline] = useState(false);
  const [timestampUnit, setTimestampUnit] = useState<"seconds" | "milliseconds">("seconds");
  const [timestampInput, setTimestampInput] = useState(String(Math.floor(Date.now() / 1000)));
  const [dateInput, setDateInput] = useState(() => {
    const localNow = new Date();
    return new Date(localNow.getTime() - localNow.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [cron, setCron] = useState<CronState>({ minute: "0", hour: "9", day: "*", month: "*", weekday: "1-5" });
  const [qrImage, setQrImage] = useState("");
  const [qrError, setQrError] = useState("");
  const [qrText, setQrText] = useState("");
  const [hashAlgorithm, setHashAlgorithm] = useState("SHA-256");
  const [hash, setHash] = useState("");
  const [hashError, setHashError] = useState("");
  const [uuidError, setUuidError] = useState("");

  useEffect(() => {
    if (toolId !== "hash-generator") return;
    let cancelled = false;
    setHash("");
    setHashError("");
    if (!input) return;
    if (!window.isSecureContext || !crypto.subtle) {
      setHashError("Hashing requires HTTPS or localhost with Web Crypto support.");
      return;
    }
    void crypto.subtle.digest(hashAlgorithm, new TextEncoder().encode(input)).then(
      (digest) => {
        if (!cancelled) setHash(Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""));
      },
      () => {
        if (!cancelled) setHashError("Could not calculate the digest with this browser.");
      },
    );
    return () => { cancelled = true; };
  }, [input, hashAlgorithm, toolId]);

  useEffect(() => {
    if (toolId !== "qr-code-generator") return;
    let cancelled = false;
    setQrImage("");
    setQrError("");
    if (!qrText.trim()) return;
    void QRCode.toDataURL(qrText, { errorCorrectionLevel: "M", margin: 2, width: 320 }).then(
      (dataUrl) => { if (!cancelled) setQrImage(dataUrl); },
      (reason: unknown) => { if (!cancelled) setQrError(reason instanceof Error ? reason.message : "Could not generate a QR code."); },
    );
    return () => { cancelled = true; };
  }, [qrText, toolId]);

  const syncResult = useMemo(() => {
    try {
      if (toolId === "json-formatter" || toolId === "json-validator") {
        if (!input.trim()) return "";
        const parsed: unknown = JSON.parse(input);
        return toolId === "json-formatter"
          ? JSON.stringify(parsed, null, 2)
          : "Valid JSON.";
      }
      if (toolId === "xml-formatter") return input ? formatXml(input) : "";
      if (toolId === "html-formatter") return input ? formatHtml(input) : "";
      if (toolId === "css-minifier") {
        return minifyCss(input);
      }
      if (toolId === "javascript-minifier") {
        return minifyJavaScriptComments(input);
      }
      if (toolId === "sql-formatter") {
        return input.replace(/\s+/gu, " ").trim().replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|UNION|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|LEFT JOIN|RIGHT JOIN|INNER JOIN|JOIN|ON)\b/giu, "\n$1")
          .replace(/^\n/u, "").replace(/,\s*/gu, ",\n  ");
      }
      if (toolId === "base64-encoder") {
        const bytes = new TextEncoder().encode(input);
        let binary = "";
        for (const byte of bytes) binary += String.fromCharCode(byte);
        return btoa(binary);
      }
      if (toolId === "base64-decoder") {
        const compact = input.replace(/\s/gu, "");
        if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(compact)) throw new Error("Enter valid standard Base64.");
        return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(compact), (char) => char.charCodeAt(0)));
      }
      if (toolId === "url-encoder") return encodeURIComponent(input);
      if (toolId === "url-decoder") {
        try { return decodeURIComponent(input.replace(/\+/gu, " ")); }
        catch { throw new Error("Invalid percent-encoded URL text."); }
      }
      if (toolId === "html-entity-converter") {
        if (entityMode === "encode") {
          return input.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;").replace(/"/gu, "&quot;").replace(/'/gu, "&#39;");
        }
        return input.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/giu, (entity) => {
          const textarea = document.createElement("textarea");
          textarea.innerHTML = entity;
          return textarea.value;
        });
      }
      if (toolId === "regex-tester") {
        const flags = `${flagGlobal ? "g" : ""}${flagIgnoreCase ? "i" : ""}${flagMultiline ? "m" : ""}`;
        const expression = new RegExp(input, flags);
        return JSON.stringify([...secondInput.matchAll(new RegExp(expression.source, `${flags}g`))].map((match) => ({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
        })), null, 2);
      }
      if (toolId === "jwt-decoder") {
        const segments = input.trim().split(".");
        if (segments.length !== 3) throw new Error("A JWT should have three dot-separated segments.");
        return JSON.stringify({
          header: JSON.parse(base64UrlDecode(segments[0])) as unknown,
          payload: JSON.parse(base64UrlDecode(segments[1])) as unknown,
          signature: `${segments[2].slice(0, 12)}${segments[2].length > 12 ? "…" : ""} (${segments[2].length} characters)`,
        }, null, 2);
      }
      if (toolId === "timestamp-converter") {
        const iso = isoFromTimestamp(timestampInput, timestampUnit);
        return `ISO (UTC): ${iso || "Invalid timestamp"}\nLocal: ${iso ? new Date(iso).toLocaleString() : "Invalid timestamp"}\nUnix ${timestampUnit}: ${timestampFromIso(dateInput, timestampUnit) || "Invalid date"}`;
      }
      if (toolId === "yaml-to-json") return input ? JSON.stringify(parseYaml(input), null, 2) : "";
      if (toolId === "markdown-to-html") return input ? markdownHtml(input) : "";
      if (toolId === "json-to-csv") {
        if (!input.trim()) return "";
        const parsed: unknown = JSON.parse(input);
        if (!Array.isArray(parsed) || parsed.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
          throw new Error("Input must be a JSON array of objects.");
        }
        const records = parsed as Record<string, unknown>[];
        const headers = [...new Set(records.flatMap((row) => Object.keys(row)))];
        if (!headers.length) return "";
        return [headers.map(csvEscape).join(","), ...records.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
      }
      if (toolId === "csv-to-json") {
        const rows = csvParse(input);
        if (!rows.length) return "[]";
        const headers = rows[0].map((header) => header.trim());
        if (new Set(headers).size !== headers.length || headers.some((header) => !header)) throw new Error("CSV headers must be non-empty and unique.");
        const records = rows.slice(1).map((row, rowIndex) => {
          if (row.length !== headers.length) throw new Error(`Row ${rowIndex + 2} has ${row.length} columns; expected ${headers.length}.`);
          return Object.fromEntries(headers.map((header, index) => [header, row[index]]));
        });
        return JSON.stringify(records, null, 2);
      }
      if (toolId === "cron-expression-generator") {
        const expression = `${cron.minute} ${cron.hour} ${cron.day} ${cron.month} ${cron.weekday}`;
        if (!cron.minute || !cron.hour || !cron.day || !cron.month || !cron.weekday || /\s/u.test(cron.minute.trim()) || /\s/u.test(cron.hour.trim()) || /\s/u.test(cron.day.trim()) || /\s/u.test(cron.month.trim()) || /\s/u.test(cron.weekday.trim())) {
          throw new Error("Enter one cron field value per box.");
        }
        return `${expression}\n${cron.minute === "0" && cron.hour === "9" && cron.day === "*" && cron.month === "*" && cron.weekday === "1-5" ? "At 9:00 AM, Monday through Friday." : "Standard five-field cron: minute hour day-of-month month day-of-week."}`;
      }
      if (toolId === "diff-checker") return JSON.stringify(diffText(input, secondInput));
      if (toolId === "code-syntax-highlighter") return input;
      return "";
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not process the input.";
      return `ERROR:${message}`;
    }
  }, [toolId, input, secondInput, flagGlobal, flagIgnoreCase, flagMultiline, timestampInput, timestampUnit, dateInput, cron, entityMode]);

  const processingError = syncResult.startsWith("ERROR:") ? syncResult.slice(6) : "";
  const processingOutput = processingError ? "" : syncResult;

  function generateUuid() {
    if (crypto.randomUUID) {
      setOutput(Array.from({ length: 5 }, () => crypto.randomUUID()).join("\n"));
      setUuidError("");
      return;
    }
    if (!window.isSecureContext || !crypto.getRandomValues) {
      setUuidError("Secure UUID generation requires HTTPS or localhost.");
      return;
    }
    const makeUuid = () => {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    };
    setOutput(Array.from({ length: 5 }, makeUuid).join("\n"));
    setUuidError("");
  }

  const jsonInput = toolId === "json-formatter" || toolId === "json-validator" || toolId === "json-to-csv";
  const textInput = ![
    "regex-tester", "timestamp-converter", "cron-expression-generator",
    "uuid-generator", "hash-generator", "qr-code-generator",
  ].includes(toolId);
  const cronDescription = `${cron.minute} ${cron.hour} ${cron.day} ${cron.month} ${cron.weekday}`;
  const cronHuman = cronDescription === "0 9 * * 1-5"
    ? "At 9:00 AM, Monday through Friday."
    : `Minute ${cron.minute}, hour ${cron.hour}, day ${cron.day}, month ${cron.month}, weekday ${cron.weekday}.`;
  const timestampISO = isoFromTimestamp(timestampInput, timestampUnit);
  const timestampOutput = timestampFromIso(dateInput, timestampUnit);

  return (
    <section className="productivity-panel" aria-label={`${developerToolDefinitions[toolId].title} workspace`}>
      {textInput && toolId !== "diff-checker" && <>
        <label className="productivity-field">
          <span>{toolId === "jwt-decoder" ? "JWT (decode only; never paste a live secret token)" : toolId === "markdown-to-html" ? "Markdown" : toolId === "cron-expression-generator" ? "" : "Input"}</span>
          <textarea rows={12} value={input} onChange={(event) => setInput(event.target.value)} placeholder={toolId === "json-formatter" || toolId === "json-validator" || toolId === "json-to-csv" ? '{"name":"Ada","active":true}' : "Paste or type here…"} />
        </label>
      </>}

      {(toolId === "html-entity-converter") && <div className="productivity-actions">
        <button className="secondary-button" type="button" onClick={() => setEntityMode("encode")}>Encode HTML entities</button>
        <button className="secondary-button" type="button" onClick={() => setEntityMode("decode")}>Decode HTML entities</button>
      </div>}

      {(toolId === "json-formatter" || toolId === "json-validator" || toolId === "json-to-csv") && (
        <p className="productivity-muted">{jsonInput ? "JSON syntax is checked as you type." : ""}</p>
      )}

      {toolId === "regex-tester" && <>
        <label className="productivity-field"><span>Regular expression (without slashes)</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="\\b\\w+\\b" /></label>
        <label className="productivity-field"><span>Sample text</span><textarea rows={8} value={secondInput} onChange={(event) => setSecondInput(event.target.value)} placeholder="Enter text to test against…" /></label>
        <div className="productivity-checks">
          <label className="productivity-check"><input type="checkbox" checked={flagGlobal} onChange={(event) => setFlagGlobal(event.target.checked)} />Global</label>
          <label className="productivity-check"><input type="checkbox" checked={flagIgnoreCase} onChange={(event) => setFlagIgnoreCase(event.target.checked)} />Ignore case</label>
          <label className="productivity-check"><input type="checkbox" checked={flagMultiline} onChange={(event) => setFlagMultiline(event.target.checked)} />Multiline</label>
        </div>
      </>}

      {toolId === "uuid-generator" && <>
        <div className="productivity-actions"><button className="button-primary" type="button" onClick={generateUuid}>Generate 5 UUIDs</button></div>
        {uuidError && <p className="productivity-notice" role="alert">{uuidError}</p>}
      </>}

      {toolId === "hash-generator" && <>
        <label className="productivity-field"><span>Text to hash</span><textarea rows={8} value={input} onChange={(event) => setInput(event.target.value)} /></label>
        <label className="productivity-field"><span>Algorithm</span><select value={hashAlgorithm} onChange={(event) => setHashAlgorithm(event.target.value)}>{["SHA-1", "SHA-256", "SHA-384", "SHA-512"].map((value) => <option key={value}>{value}</option>)}</select></label>
        {hashError && <p className="productivity-notice" role="alert">{hashError}</p>}
        {hash && <label className="productivity-field"><span>{hashAlgorithm} digest</span><textarea rows={3} readOnly value={hash} /></label>}
        <p className="productivity-muted">SHA-1 is legacy and should not be used for security. Hashing is one-way; no data leaves this browser.</p>
      </>}

      {toolId === "timestamp-converter" && <>
        <div className="productivity-inline">
          <label className="productivity-field"><span>Timestamp units</span><select value={timestampUnit} onChange={(event) => setTimestampUnit(event.target.value as "seconds" | "milliseconds")}><option value="seconds">Seconds</option><option value="milliseconds">Milliseconds</option></select></label>
          <label className="productivity-field"><span>Unix timestamp</span><input value={timestampInput} onChange={(event) => setTimestampInput(event.target.value)} /></label>
          <label className="productivity-field"><span>Date and time (local)</span><input type="datetime-local" value={dateInput} onChange={(event) => setDateInput(event.target.value)} /></label>
        </div>
        <p className="productivity-result">ISO (UTC): {timestampISO || "Invalid timestamp"}<br />Local: {timestampISO ? new Date(timestampISO).toLocaleString() : "Invalid timestamp"}<br />Unix {timestampUnit}: {timestampOutput !== "" ? timestampOutput : "Invalid date"}</p>
      </>}

      {toolId === "cron-expression-generator" && <>
        <div className="productivity-inline">
          {([
            ["minute", "Minute (0–59 or *)"],
            ["hour", "Hour (0–23 or *)"],
            ["day", "Day of month (1–31 or *)"],
            ["month", "Month (1–12 or *)"],
            ["weekday", "Day of week (0–7 or *)"],
          ] as const).map(([key, label]) => (
            <label className="productivity-field" key={key}><span>{label}</span><input value={cron[key]} onChange={(event) => setCron({ ...cron, [key]: event.target.value })} /></label>
          ))}
        </div>
        <p className="productivity-result"><code>{cronDescription}</code></p>
        <p className="productivity-muted">{cronHuman} Confirm syntax supported by your cron service.</p>
      </>}

      {toolId === "qr-code-generator" && <>
        <label className="productivity-field"><span>Text or URL</span><textarea rows={4} value={qrText} onChange={(event) => setQrText(event.target.value)} placeholder="https://example.com" /></label>
        {qrError && <p className="productivity-notice" role="alert">{qrError}</p>}
        {qrImage && <div className="productivity-center"><img src={qrImage} alt="Generated QR code" width={320} height={320} /><div className="productivity-actions"><a className="button-primary" href={qrImage} download="toolhub-qr.png">Download PNG</a></div></div>}
      </>}

      {(toolId === "diff-checker") && <>
        <div className="productivity-inline">
          <label className="productivity-field"><span>Original text</span><textarea rows={10} value={input} onChange={(event) => setInput(event.target.value)} /></label>
          <label className="productivity-field"><span>Changed text</span><textarea rows={10} value={secondInput} onChange={(event) => setSecondInput(event.target.value)} /></label>
        </div>
        {processingError
          ? <p className="productivity-notice" role="alert">{processingError}</p>
          : <pre className="developer-code">{(JSON.parse(processingOutput || "[]") as DiffLine[]).map((line, index) => <span className={`developer-diff-${line.kind}`} key={`${index}-${line.kind}`}>{line.kind === "added" ? "+ " : line.kind === "removed" ? "− " : "  "}{line.text || " "}{ "\n"}</span>)}</pre>}
        <p className="productivity-muted">Line-based diff. “+” lines were added; “−” lines were removed.</p>
      </>}

      {(toolId === "code-syntax-highlighter") && <>
        <label className="productivity-field"><span>Code</span><textarea rows={12} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Paste code to highlight…" /></label>
        <pre className="developer-code" aria-label="Syntax-highlighted code">{highlighter(input)}</pre>
        <p className="productivity-muted">Basic lexical highlighting for common keywords, strings, numbers, and comments; not a language parser.</p>
      </>}

      {toolId === "markdown-to-html" && processingOutput && <>
        <label className="productivity-field"><span>Generated HTML (escaped as text)</span><textarea rows={8} readOnly value={processingOutput} /></label>
        <div className="content-card"><h3>Preview</h3><div dangerouslySetInnerHTML={{ __html: processingOutput }} /></div>
      </>}

      {toolId !== "hash-generator" && toolId !== "qr-code-generator" && toolId !== "timestamp-converter" && toolId !== "cron-expression-generator" && toolId !== "uuid-generator" && toolId !== "diff-checker" && toolId !== "code-syntax-highlighter" && toolId !== "json-validator" && toolId !== "markdown-to-html" && (
        <>
          {processingError && <p className="productivity-notice" role="alert">{processingError}</p>}
          {processingOutput && <label className="productivity-field"><span>Output</span><textarea rows={Math.min(16, Math.max(3, processingOutput.split("\n").length))} readOnly value={processingOutput} /></label>}
          {toolId === "json-formatter" && !processingError && processingOutput && <p className="productivity-muted">Valid JSON.</p>}
          {(toolId === "json-to-csv" || toolId === "csv-to-json") && processingOutput && <div className="productivity-actions"><button className="secondary-button" type="button" onClick={() => downloadText(processingOutput, toolId === "json-to-csv" ? "output.csv" : "output.json", toolId === "json-to-csv" ? "text/csv" : "application/json")}>Download output</button></div>}
        </>
      )}
      {toolId === "uuid-generator" && output && <label className="productivity-field"><span>Generated UUIDs</span><textarea rows={6} readOnly value={output} /></label>}
      {toolId === "json-validator" && <p className={processingError ? "productivity-notice" : "productivity-result"} role={processingError ? "alert" : "status"}>{processingError || (processingOutput || "Enter JSON to validate.")}</p>}
      {toolId === "timestamp-converter" && (!timestampISO || timestampOutput === "") && <p className="productivity-notice" role="alert">Enter a valid timestamp and date to convert in both directions.</p>}
      {toolId === "cron-expression-generator" && processingError && <p className="productivity-notice" role="alert">{processingError}</p>}
      {toolId === "qr-code-generator" && !qrText && <p className="productivity-muted">QR generation happens in your browser; content is not uploaded.</p>}
    </section>
  );
}
