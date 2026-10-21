export function countWords(text: string): number {
  return text.trim().match(/\S+/gu)?.length ?? 0;
}

export function countCharacters(text: string): number {
  return Array.from(text).length;
}

export function countCharactersWithoutWhitespace(text: string): number {
  return Array.from(text.replace(/\s/gu, "")).length;
}

export function countSentences(text: string): number {
  return text.match(/[^.!?]+(?:[.!?]+|$)/gu)?.filter((part) => /\S/u.test(part))
    .length ?? 0;
}

export function convertCase(
  text: string,
  style: "uppercase" | "lowercase" | "title" | "sentence",
): string {
  if (style === "uppercase") return text.toUpperCase();
  if (style === "lowercase") return text.toLowerCase();

  if (style === "title") {
    return text.toLowerCase().replace(
      /(^|[\s'’\-])(\p{L})/gu,
      (_match, separator: string, letter: string) =>
        separator + letter.toUpperCase(),
    );
  }

  return text.toLowerCase().replace(
    /(^\s*|[.!?]\s+)(\p{L})/gu,
    (_match, separator: string, letter: string) =>
      separator + letter.toUpperCase(),
  );
}

export function removeExtraSpaces(text: string): string {
  return text
    .replace(/\r\n?/gu, "\n")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/gu, " ").trim())
    .join("\n");
}

export function removeDuplicateLines(text: string, ignoreCase: boolean): string {
  const seen = new Set<string>();
  return text
    .replace(/\r\n?/gu, "\n")
    .split("\n")
    .filter((line) => {
      const key = ignoreCase ? line.toLocaleLowerCase() : line;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");
}

export function sortLines(
  text: string,
  options: { ignoreCase: boolean; descending: boolean },
): string {
  const lines = text.replace(/\r\n?/gu, "\n").split("\n");
  const collator = new Intl.Collator(undefined, {
    sensitivity: options.ignoreCase ? "accent" : "variant",
    numeric: true,
  });
  lines.sort((a, b) => collator.compare(a, b));
  if (options.descending) lines.reverse();
  return lines.join("\n");
}

export function diffLines(left: string, right: string): string {
  const leftLines = left.replace(/\r\n?/gu, "\n").split("\n");
  const rightLines = right.replace(/\r\n?/gu, "\n").split("\n");
  const maxLength = Math.max(leftLines.length, rightLines.length);
  const diff: string[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const a = leftLines[index];
    const b = rightLines[index];
    if (a === b) {
      if (a !== undefined) diff.push(`  ${a}`);
      continue;
    }
    if (a !== undefined) diff.push(`- ${a}`);
    if (b !== undefined) diff.push(`+ ${b}`);
  }

  return diff.join("\n");
}

export function safeRegExp(pattern: string, flags: string): RegExp | null {
  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

export function replaceAllText(
  text: string,
  search: string,
  replacement: string,
  options: { useRegex: boolean; matchCase: boolean },
): { value: string; replacements: number; error?: string } {
  if (!search) return { value: text, replacements: 0, error: "Search text is required." };

  if (options.useRegex) {
    const regex = safeRegExp(search, options.matchCase ? "gu" : "giu");
    if (!regex) return { value: text, replacements: 0, error: "Invalid regular expression." };
    const matches = text.match(regex);
    return {
      value: text.replace(regex, replacement),
      replacements: matches?.length ?? 0,
    };
  }

  const source = options.matchCase ? text : text.toLocaleLowerCase();
  const needle = options.matchCase ? search : search.toLocaleLowerCase();
  if (!needle) return { value: text, replacements: 0 };

  let start = 0;
  let replacements = 0;
  let result = "";
  while (start < text.length) {
    const at = source.indexOf(needle, start);
    if (at < 0) {
      result += text.slice(start);
      break;
    }
    result += text.slice(start, at) + replacement;
    start = at + search.length;
    replacements += 1;
  }

  return { value: result, replacements };
}

export function slugifyText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase()
    .replace(/&/gu, " and ")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .replace(/-{2,}/gu, "-");
}

export function reverseText(text: string): string {
  return Array.from(text).reverse().join("");
}

export function reverseLines(text: string): string {
  return text.replace(/\r\n?/gu, "\n").split("\n").map(reverseText).join("\n");
}

function countSyllables(word: string): number {
  const cleaned = word.toLocaleLowerCase().replace(/[^a-z]/gu, "");
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;
  const withoutTrailingE = cleaned.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/u, "");
  const groups = withoutTrailingE.match(/[aeiouy]{1,2}/gu)?.length ?? 0;
  return Math.max(1, groups);
}

export interface ReadabilityStats {
  words: number;
  sentences: number;
  characters: number;
  avgWordsPerSentence: number;
  avgCharactersPerWord: number;
  readingEase: number;
  gradeLevel: number;
  estimatedReadingTimeMinutes: number;
}

export function getReadabilityStats(text: string): ReadabilityStats {
  const words = countWords(text);
  const sentences = Math.max(countSentences(text), 1);
  const characters = countCharacters(text);
  const wordList = text.match(/\p{L}+/gu) ?? [];
  const syllables = wordList.reduce((sum, word) => sum + countSyllables(word), 0);
  const avgWordsPerSentence = words / sentences;
  const avgCharactersPerWord = words > 0 ? characters / words : 0;
  const readingEase =
    words > 0 ? 206.835 - 1.015 * avgWordsPerSentence - 84.6 * (syllables / words) : 0;
  const gradeLevel =
    words > 0 ? 0.39 * avgWordsPerSentence + 11.8 * (syllables / words) - 15.59 : 0;

  return {
    words,
    sentences,
    characters,
    avgWordsPerSentence,
    avgCharactersPerWord,
    readingEase,
    gradeLevel,
    estimatedReadingTimeMinutes: words / 200,
  };
}

function splitSentences(text: string): string[] {
  return (
    text.match(/[^.!?]+[.!?]*/gu)?.map((entry) => entry.trim()).filter(Boolean) ?? []
  );
}

export function summarizeText(text: string, maxSentences: number): string {
  const sentences = splitSentences(text);
  if (sentences.length <= maxSentences) return sentences.join(" ");

  const words = (text.toLocaleLowerCase().match(/\p{L}+/gu) ?? []).filter(
    (word) => word.length > 2,
  );
  const frequencies = new Map<string, number>();
  for (const word of words) {
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }

  const scored = sentences.map((sentence, index) => {
    const tokens = sentence.toLocaleLowerCase().match(/\p{L}+/gu) ?? [];
    const score = tokens.reduce((sum, token) => sum + (frequencies.get(token) ?? 0), 0);
    return { sentence, index, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(1, maxSentences))
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.sentence)
    .join(" ");
}

export function removeLineBreaks(text: string, compactParagraphs: boolean): string {
  const normalized = text.replace(/\r\n?/gu, "\n");
  if (!compactParagraphs) return normalized.replace(/\n+/gu, " ").replace(/[^\S\n]+/gu, " ").trim();
  return normalized
    .split(/\n{2,}/gu)
    .map((paragraph) => paragraph.replace(/\n+/gu, " ").replace(/[^\S\n]+/gu, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

export function repeatText(text: string, repeatCount: number, separator: string): string {
  if (!text || repeatCount <= 0) return "";
  return Array.from({ length: repeatCount }, () => text).join(separator);
}

const wordBank = [
  "amber",
  "vector",
  "garden",
  "nebula",
  "craft",
  "signal",
  "pixel",
  "harbor",
  "quartz",
  "fluent",
  "moment",
  "radius",
  "fusion",
  "forest",
  "bridge",
];

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateRandomWords(count: number): string {
  return Array.from({ length: Math.max(1, count) }, () => randomFrom(wordBank)).join(" ");
}

export function generateRandomSentences(count: number): string {
  return Array.from({ length: Math.max(1, count) }, () => {
    const size = 6 + Math.floor(Math.random() * 7);
    const words = generateRandomWords(size).split(" ");
    return `${words[0][0].toUpperCase()}${words[0].slice(1)} ${words.slice(1).join(" ")}.`;
  }).join(" ");
}

export function generateRandomPassword(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  return Array.from({ length: Math.max(6, length) }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function isPalindrome(text: string): boolean {
  const normalized = Array.from(text.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "")).join("");
  return normalized.length > 0 && normalized === Array.from(normalized).reverse().join("");
}

const natoMap: Record<string, string> = {
  A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", F: "Foxtrot", G: "Golf",
  H: "Hotel", I: "India", J: "Juliett", K: "Kilo", L: "Lima", M: "Mike", N: "November",
  O: "Oscar", P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango", U: "Uniform",
  V: "Victor", W: "Whiskey", X: "X-ray", Y: "Yankee", Z: "Zulu",
  0: "Zero", 1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight", 9: "Nine",
};

export function toNatoAlphabet(text: string): string {
  return Array.from(text.toLocaleUpperCase())
    .map((char) => {
      if (char === " ") return "/";
      return natoMap[char] ?? char;
    })
    .join(" ");
}

const morseMap: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..",
  J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....",
  7: "--...", 8: "---..", 9: "----.",
};

const reverseMorseMap = Object.fromEntries(
  Object.entries(morseMap).map(([key, value]) => [value, key]),
);

export function toMorseCode(text: string): string {
  return Array.from(text.toLocaleUpperCase())
    .map((char) => {
      if (char === " ") return "/";
      return morseMap[char] ?? "?";
    })
    .join(" ");
}

export function fromMorseCode(text: string): string {
  return text
    .trim()
    .split(/\s+/gu)
    .map((token) => {
      if (token === "/") return " ";
      return reverseMorseMap[token] ?? "�";
    })
    .join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}

function formatInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/gu, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/gu, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gu, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export function markdownToSafeHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/gu, "\n").split("\n");
  const rendered = lines.map((line) => {
    const escaped = escapeHtml(line);
    if (/^###\s+/u.test(escaped)) return `<h3>${formatInlineMarkdown(escaped.replace(/^###\s+/u, ""))}</h3>`;
    if (/^##\s+/u.test(escaped)) return `<h2>${formatInlineMarkdown(escaped.replace(/^##\s+/u, ""))}</h2>`;
    if (/^#\s+/u.test(escaped)) return `<h1>${formatInlineMarkdown(escaped.replace(/^#\s+/u, ""))}</h1>`;
    if (/^>\s+/u.test(escaped)) return `<blockquote>${formatInlineMarkdown(escaped.replace(/^>\s+/u, ""))}</blockquote>`;
    if (/^\s*[-*]\s+/u.test(escaped)) return `<li>${formatInlineMarkdown(escaped.replace(/^\s*[-*]\s+/u, ""))}</li>`;
    if (!escaped.trim()) return "<br />";
    return `<p>${formatInlineMarkdown(escaped)}</p>`;
  });

  return rendered.join("");
}

export interface UnicodeEntry {
  char: string;
  codePoint: string;
  utf16: string;
  nameHint: string;
}

export function lookupUnicode(text: string): UnicodeEntry[] {
  return Array.from(text).map((char) => {
    const codePoint = char.codePointAt(0) ?? 0;
    return {
      char,
      codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
      utf16: Array.from(char)
        .flatMap((unit) =>
          unit
            .split("")
            .map((codeUnit) =>
              codeUnit.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0"),
            ),
        )
        .join(" "),
      nameHint:
        /\p{L}/u.test(char)
          ? "Letter"
          : /\p{N}/u.test(char)
            ? "Number"
            : /\s/u.test(char)
              ? "Whitespace"
              : "Symbol",
    };
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(salt),
      iterations: 120_000,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptText(
  plainText: string,
  passphrase: string,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    new TextEncoder().encode(plainText),
  );

  return [
    "v1",
    bytesToBase64(salt),
    bytesToBase64(iv),
    bytesToBase64(new Uint8Array(encrypted)),
  ].join(".");
}

export async function decryptText(
  payload: string,
  passphrase: string,
): Promise<string> {
  const [version, saltPart, ivPart, dataPart] = payload.split(".");
  if (version !== "v1" || !saltPart || !ivPart || !dataPart) {
    throw new Error("Invalid encrypted text format.");
  }

  const key = await deriveKey(passphrase, base64ToBytes(saltPart));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(ivPart)) },
    key,
    toArrayBuffer(base64ToBytes(dataPart)),
  );
  return new TextDecoder().decode(decrypted);
}
