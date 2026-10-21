export type TextToolKind =
  | "counter"
  | "case"
  | "spaces"
  | "line-dedupe"
  | "line-sort"
  | "diff"
  | "find-replace"
  | "slug"
  | "lorem"
  | "reverse"
  | "readability"
  | "summarize"
  | "speech"
  | "remove-line-breaks"
  | "repeater"
  | "random"
  | "palindrome"
  | "nato"
  | "morse"
  | "markdown"
  | "unicode"
  | "crypto";

export interface TextToolDefinition {
  title: string;
  intro: string;
  kind: TextToolKind;
}

export const textToolDefinitions = {
  "word-counter": {
    title: "Word Counter",
    intro: "Count words and characters instantly as you type or paste text.",
    kind: "counter",
  },
  "character-counter": {
    title: "Character Counter",
    intro: "Count characters with and without spaces as you type or paste text.",
    kind: "counter",
  },
  "sentence-counter": {
    title: "Sentence Counter",
    intro: "Count sentences in a text sample, with live word and character totals.",
    kind: "counter",
  },
  "case-converter": {
    title: "Case Converter",
    intro: "Convert text to uppercase, lowercase, title case, or sentence case in your browser.",
    kind: "case",
  },
  "remove-extra-spaces": {
    title: "Remove Extra Spaces",
    intro: "Collapse repeated spaces and trim line edges while preserving paragraph breaks.",
    kind: "spaces",
  },
  "duplicate-lines-remover": {
    title: "Duplicate Lines Remover",
    intro: "Remove repeated lines while preserving the first occurrence order.",
    kind: "line-dedupe",
  },
  "sort-lines": {
    title: "Sort Lines",
    intro: "Sort lines alphabetically with optional reverse and case-insensitive mode.",
    kind: "line-sort",
  },
  "text-diff-checker": {
    title: "Text Diff Checker",
    intro: "Compare two text blocks line by line to spot additions and removals quickly.",
    kind: "diff",
  },
  "find-and-replace": {
    title: "Find and Replace",
    intro: "Find text by literal value or regular expression and replace it instantly.",
    kind: "find-replace",
  },
  "slug-generator": {
    title: "Slug Generator",
    intro: "Create URL-friendly slugs from titles and plain text.",
    kind: "slug",
  },
  "lorem-ipsum-generator": {
    title: "Lorem Ipsum Generator",
    intro: "Generate placeholder words, sentences, or paragraphs for drafts and mocks.",
    kind: "lorem",
  },
  "text-reverser": {
    title: "Text Reverser",
    intro: "Reverse complete text or line-by-line content while preserving Unicode characters.",
    kind: "reverse",
  },
  "readability-checker": {
    title: "Readability Checker",
    intro: "Estimate readability with common text metrics such as reading ease.",
    kind: "readability",
  },
  "text-summarizer": {
    title: "Text Summarizer",
    intro: "Generate an extractive summary by selecting top-ranked sentences.",
    kind: "summarize",
  },
  "text-to-speech": {
    title: "Text to Speech",
    intro: "Read text aloud in your browser with speed and voice controls.",
    kind: "speech",
  },
  "speech-to-text": {
    title: "Speech to Text",
    intro: "Transcribe microphone speech to text directly in supported browsers.",
    kind: "speech",
  },
  "remove-line-breaks": {
    title: "Remove Line Breaks",
    intro: "Flatten multi-line text into a single line or compact paragraphs.",
    kind: "remove-line-breaks",
  },
  "text-repeater": {
    title: "Text Repeater",
    intro: "Repeat text a chosen number of times with customizable separators.",
    kind: "repeater",
  },
  "random-text-generator": {
    title: "Random Text Generator",
    intro: "Generate random words, sentences, and passwords for quick placeholders.",
    kind: "random",
  },
  "palindrome-checker": {
    title: "Palindrome Checker",
    intro: "Check whether text reads the same forwards and backwards.",
    kind: "palindrome",
  },
  "nato-alphabet-converter": {
    title: "NATO Alphabet Converter",
    intro: "Convert plain text characters to NATO phonetic alphabet words.",
    kind: "nato",
  },
  "morse-code-converter": {
    title: "Morse Code Converter",
    intro: "Convert text to Morse code and Morse code back to text.",
    kind: "morse",
  },
  "markdown-previewer": {
    title: "Markdown Previewer",
    intro: "Preview a safe rendered view of Markdown and copy generated HTML.",
    kind: "markdown",
  },
  "unicode-character-lookup": {
    title: "Unicode Character Lookup",
    intro: "Inspect characters with Unicode code points and UTF-16 values.",
    kind: "unicode",
  },
  "text-encryptor-and-decryptor": {
    title: "Text Encryptor and Decryptor",
    intro: "Encrypt and decrypt text with AES-GCM and a passphrase in your browser.",
    kind: "crypto",
  },
} as const satisfies Record<string, TextToolDefinition>;

export type TextToolId = keyof typeof textToolDefinitions;

export const textToolIds = Object.keys(textToolDefinitions) as TextToolId[];

export function isTextToolId(id: string): id is TextToolId {
  return id in textToolDefinitions;
}
