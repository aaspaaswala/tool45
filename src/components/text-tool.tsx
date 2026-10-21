"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Clipboard,
  Mic,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
} from "lucide-react";

import {
  convertCase,
  countCharacters,
  countCharactersWithoutWhitespace,
  countSentences,
  countWords,
  decryptText,
  diffLines,
  encryptText,
  fromMorseCode,
  generateRandomPassword,
  generateRandomSentences,
  generateRandomWords,
  getReadabilityStats,
  isPalindrome,
  lookupUnicode,
  markdownToSafeHtml,
  removeDuplicateLines,
  removeExtraSpaces,
  removeLineBreaks,
  repeatText,
  replaceAllText,
  reverseLines,
  reverseText,
  slugifyText,
  sortLines,
  summarizeText,
  toMorseCode,
  toNatoAlphabet,
} from "@/lib/tools/text-utils";
import {
  textToolDefinitions,
  type TextToolId,
} from "@/lib/tools/text-tool-config";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const caseActions = [
  { id: "uppercase", label: "UPPERCASE" },
  { id: "lowercase", label: "lowercase" },
  { id: "title", label: "Title Case" },
  { id: "sentence", label: "Sentence case" },
] as const;

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Very easy";
  if (score >= 60) return "Easy";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Difficult";
  return "Very difficult";
}

function generateLoremIpsum(paragraphs: number): string {
  const sentencePool = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Suspendisse potenti sed vulputate mauris nec nibh pretium, eget ultrices magna posuere.",
    "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
    "Curabitur interdum enim et mauris fermentum, at vulputate nibh malesuada.",
    "Nam facilisis justo in magna tempus, quis finibus ligula luctus.",
    "Aliquam erat volutpat sed tempor est in posuere pharetra.",
    "Ut feugiat nulla sit amet velit vulputate, sed laoreet lorem facilisis.",
    "Quisque vel leo a libero eleifend volutpat in non massa.",
  ];
  return Array.from({ length: Math.max(1, paragraphs) }, () =>
    Array.from({ length: 4 }, (_, index) => sentencePool[(index + Math.floor(Math.random() * 4)) % sentencePool.length]).join(" "),
  ).join("\n\n");
}

export function TextTool({ toolId }: { toolId: TextToolId }) {
  const definition = textToolDefinitions[toolId];
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [message, setMessage] = useState("");
  const [copySucceeded, setCopySucceeded] = useState(false);
  const [diffLeft, setDiffLeft] = useState("");
  const [diffRight, setDiffRight] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [descending, setDescending] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceTextValue, setReplaceTextValue] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [summarySentences, setSummarySentences] = useState(3);
  const [compactParagraphs, setCompactParagraphs] = useState(true);
  const [repeatCount, setRepeatCount] = useState(3);
  const [repeatSeparator, setRepeatSeparator] = useState("\n");
  const [randomMode, setRandomMode] = useState<"words" | "sentences" | "password">("words");
  const [randomCount, setRandomCount] = useState(12);
  const [passwordLength, setPasswordLength] = useState(16);
  const [morseDirection, setMorseDirection] = useState<"to" | "from">("to");
  const [passphrase, setPassphrase] = useState("");
  const [speechRate, setSpeechRate] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const ttsRef = useRef<SpeechSynthesisUtterance | null>(null);

  const metrics = useMemo(
    () => [
      { label: "Words", value: countWords(text) },
      { label: "Characters", value: countCharacters(text) },
      { label: "Without spaces", value: countCharactersWithoutWhitespace(text) },
      { label: "Sentences", value: countSentences(text) },
    ],
    [text],
  );
  const readability = useMemo(() => getReadabilityStats(text), [text]);
  const unicodeRows = useMemo(() => lookupUnicode(text).slice(0, 300), [text]);
  const markdownHtml = useMemo(() => markdownToSafeHtml(text), [text]);
  const palindrome = useMemo(() => isPalindrome(text), [text]);
  const speechSupported =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const visibleMetrics =
    toolId === "word-counter"
      ? metrics.filter((metric) => metric.label !== "Without spaces")
      : toolId === "character-counter"
        ? metrics.filter(
            (metric) =>
              metric.label !== "Sentences" && metric.label !== "Words",
          )
        : toolId === "sentence-counter"
          ? metrics.filter((metric) => metric.label !== "Without spaces")
          : [];

  useEffect(() => {
    return () => {
      speechRef.current?.stop();
      if (ttsRef.current && typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function clearAll() {
    setText("");
    setResult("");
    setMessage("");
    setCopySucceeded(false);
    setDiffLeft("");
    setDiffRight("");
  }

  function setResultWithMessage(value: string, successMessage: string) {
    setResult(value);
    setMessage(successMessage);
    setCopySucceeded(false);
  }

  function applyCase(style: (typeof caseActions)[number]["id"]) {
    setResultWithMessage(
      convertCase(text, style),
      "Text converted. Your original text is unchanged.",
    );
  }

  function cleanSpaces() {
    setResultWithMessage(
      removeExtraSpaces(text),
      "Extra spaces removed. Review the result below.",
    );
  }

  function runAction() {
    if (definition.kind === "line-dedupe") {
      setResultWithMessage(
        removeDuplicateLines(text, ignoreCase),
        "Duplicate lines removed.",
      );
      return;
    }
    if (definition.kind === "line-sort") {
      setResultWithMessage(
        sortLines(text, { ignoreCase, descending }),
        "Lines sorted.",
      );
      return;
    }
    if (definition.kind === "diff") {
      setResultWithMessage(
        diffLines(diffLeft, diffRight),
        "Diff generated. Lines prefixed with '+' were added and '-' were removed.",
      );
      return;
    }
    if (definition.kind === "find-replace") {
      const transformed = replaceAllText(text, findText, replaceTextValue, {
        useRegex,
        matchCase: !ignoreCase,
      });
      if (transformed.error) {
        setMessage(transformed.error);
        return;
      }
      setResultWithMessage(
        transformed.value,
        `Done. Replaced ${formatNumber(transformed.replacements)} occurrence(s).`,
      );
      return;
    }
    if (definition.kind === "slug") {
      setResultWithMessage(slugifyText(text), "Slug generated.");
      return;
    }
    if (definition.kind === "lorem") {
      setResultWithMessage(
        generateLoremIpsum(Math.max(1, summarySentences)),
        "Lorem ipsum generated.",
      );
      return;
    }
    if (definition.kind === "reverse") {
      setResultWithMessage(
        compactParagraphs ? reverseLines(text) : reverseText(text),
        "Text reversed.",
      );
      return;
    }
    if (definition.kind === "summarize") {
      setResultWithMessage(
        summarizeText(text, summarySentences),
        "Summary generated.",
      );
      return;
    }
    if (definition.kind === "remove-line-breaks") {
      setResultWithMessage(
        removeLineBreaks(text, compactParagraphs),
        compactParagraphs
          ? "Line breaks compacted while preserving paragraph gaps."
          : "Line breaks removed.",
      );
      return;
    }
    if (definition.kind === "repeater") {
      setResultWithMessage(
        repeatText(text, repeatCount, repeatSeparator.replace(/\\n/gu, "\n")),
        "Text repeated.",
      );
      return;
    }
    if (definition.kind === "random") {
      if (randomMode === "password") {
        setResultWithMessage(
          generateRandomPassword(passwordLength),
          "Random password generated.",
        );
        return;
      }
      setResultWithMessage(
        randomMode === "words"
          ? generateRandomWords(randomCount)
          : generateRandomSentences(randomCount),
        "Random text generated.",
      );
      return;
    }
    if (definition.kind === "nato") {
      setResultWithMessage(toNatoAlphabet(text), "Converted to NATO phonetic alphabet.");
      return;
    }
    if (definition.kind === "morse") {
      setResultWithMessage(
        morseDirection === "to" ? toMorseCode(text) : fromMorseCode(text),
        morseDirection === "to" ? "Converted to Morse code." : "Converted to plain text.",
      );
      return;
    }
  }

  async function copyResult() {
    if (!result) {
      setMessage("There is no output to copy yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(result);
      setMessage("Copied to clipboard.");
      setCopySucceeded(true);
    } catch {
      setMessage(
        "Clipboard access was unavailable. Select the result and copy it manually.",
      );
      setCopySucceeded(false);
    }
  }

  async function runEncrypt() {
    if (!text || !passphrase) {
      setMessage("Enter both text and passphrase first.");
      return;
    }
    try {
      const encrypted = await encryptText(text, passphrase);
      setResultWithMessage(encrypted, "Text encrypted with AES-GCM.");
    } catch {
      setMessage("Encryption failed. Please try again.");
    }
  }

  async function runDecrypt() {
    if (!text || !passphrase) {
      setMessage("Enter encrypted text and passphrase first.");
      return;
    }
    try {
      const decrypted = await decryptText(text, passphrase);
      setResultWithMessage(decrypted, "Text decrypted.");
    } catch {
      setMessage("Decryption failed. Check the passphrase and encrypted text.");
    }
  }

  function startListening() {
    if (!speechSupported || typeof window === "undefined") {
      setMessage("Speech recognition is not supported in this browser.");
      return;
    }

    const ctor = (
      window as Window & {
        webkitSpeechRecognition?: SpeechRecognitionCtor;
        SpeechRecognition?: SpeechRecognitionCtor;
      }
    ).webkitSpeechRecognition ??
      (
        window as Window & {
          SpeechRecognition?: SpeechRecognitionCtor;
        }
      ).SpeechRecognition;
    if (!ctor) {
      setMessage("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((item) => item[0]?.transcript ?? "")
        .join(" ");
      setText(transcript.trim());
      setMessage("Listening…");
    };
    recognition.onerror = (event) => {
      setMessage(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      setMessage("Speech capture stopped.");
    };
    recognition.start();
    speechRef.current = recognition;
    setIsListening(true);
    setMessage("Microphone started.");
  }

  function stopListening() {
    speechRef.current?.stop();
    setIsListening(false);
  }

  function speakText() {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) {
      setMessage("Text-to-speech is unavailable in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setMessage("Speaking...");
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setMessage("Playback complete.");
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setMessage("Playback failed.");
    };
    ttsRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setMessage("Playback stopped.");
    }
  }

  const needsMainResult =
    definition.kind !== "counter" &&
    definition.kind !== "readability" &&
    definition.kind !== "palindrome" &&
    definition.kind !== "unicode" &&
    definition.kind !== "markdown" &&
    definition.kind !== "speech" &&
    definition.kind !== "crypto";

  return (
    <div className="text-tool-layout">
      <section className="text-tool-workspace" aria-label={`${definition.title} workspace`}>
        {definition.kind !== "diff" && definition.kind !== "lorem" && definition.kind !== "random" && (
          <div className="text-tool-panel">
            <div className="text-tool-panel-heading">
              <label htmlFor="text-tool-input">Your text</label>
              <button
                className="tool-quiet-button"
                type="button"
                onClick={clearAll}
                disabled={!text && !result && !message}
              >
                <RotateCcw size={15} aria-hidden="true" />
                Clear
              </button>
            </div>
            <textarea
              className="text-tool-input"
              id="text-tool-input"
              placeholder="Type or paste your text here…"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setMessage("");
                setCopySucceeded(false);
              }}
              spellCheck
            />
            <div className="text-tool-input-foot">
              <span>{formatNumber(countWords(text))} words · {formatNumber(countCharacters(text))} characters</span>
              <span>Live count</span>
            </div>
          </div>
        )}

        {visibleMetrics.length > 0 && (
          <div className="text-metrics" aria-label="Live text statistics">
            {visibleMetrics.map((metric) => (
              <div className="text-metric" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{formatNumber(metric.value)}</strong>
              </div>
            ))}
          </div>
        )}

        {definition.kind === "case" && (
          <div className="text-tool-panel action-panel">
            <div className="text-tool-panel-heading">
              <span>Choose a case</span>
            </div>
            <div className="case-actions">
              {caseActions.map((action) => (
                <button
                  className="secondary-button"
                  key={action.id}
                  type="button"
                  onClick={() => applyCase(action.id)}
                  disabled={!text}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {definition.kind === "spaces" && (
          <div className="text-tool-action-row">
            <button className="button-primary tool-run-button" type="button" onClick={cleanSpaces} disabled={!text}>
              <Sparkles size={16} aria-hidden="true" />
              Clean up text
            </button>
          </div>
        )}

        {(definition.kind === "line-dedupe" || definition.kind === "line-sort" || definition.kind === "find-replace") && (
          <div className="text-tool-panel action-panel">
            <div className="case-actions">
              <label className="option-line">
                <input type="checkbox" checked={ignoreCase} onChange={(event) => setIgnoreCase(event.target.checked)} />
                Ignore case
              </label>
              {definition.kind === "line-sort" && (
                <label className="option-line">
                  <input type="checkbox" checked={descending} onChange={(event) => setDescending(event.target.checked)} />
                  Descending order
                </label>
              )}
              {definition.kind === "find-replace" && (
                <label className="option-line">
                  <input type="checkbox" checked={useRegex} onChange={(event) => setUseRegex(event.target.checked)} />
                  Use regular expression
                </label>
              )}
            </div>
            {definition.kind === "find-replace" && (
              <div className="text-form-grid">
                <input className="text-tool-inline-input" value={findText} onChange={(event) => setFindText(event.target.value)} placeholder="Find" />
                <input className="text-tool-inline-input" value={replaceTextValue} onChange={(event) => setReplaceTextValue(event.target.value)} placeholder="Replace with" />
              </div>
            )}
            <div className="text-tool-action-row">
              <button className="button-primary tool-run-button" type="button" onClick={runAction} disabled={!text}>
                <Sparkles size={16} aria-hidden="true" />
                Run
              </button>
            </div>
          </div>
        )}

        {definition.kind === "diff" && (
          <div className="text-tool-panel action-panel">
            <div className="text-tool-panel-heading">
              <span>Compare two texts</span>
            </div>
            <div className="text-form-grid">
              <textarea className="text-tool-input text-tool-output" placeholder="Original text" value={diffLeft} onChange={(event) => setDiffLeft(event.target.value)} />
              <textarea className="text-tool-input text-tool-output" placeholder="Updated text" value={diffRight} onChange={(event) => setDiffRight(event.target.value)} />
            </div>
            <div className="text-tool-action-row">
              <button className="button-primary tool-run-button" type="button" onClick={runAction} disabled={!diffLeft && !diffRight}>
                <Sparkles size={16} aria-hidden="true" />
                Compare
              </button>
            </div>
          </div>
        )}

        {(definition.kind === "slug" ||
          definition.kind === "summarize" ||
          definition.kind === "remove-line-breaks" ||
          definition.kind === "reverse" ||
          definition.kind === "repeater" ||
          definition.kind === "nato" ||
          definition.kind === "morse") && (
          <div className="text-tool-panel action-panel">
            {definition.kind === "summarize" && (
              <div className="text-form-grid text-form-grid-single">
                <label className="option-line">
                  Summary sentences
                  <input className="text-tool-inline-input" type="number" min={1} max={8} value={summarySentences} onChange={(event) => setSummarySentences(Number(event.target.value) || 1)} />
                </label>
              </div>
            )}
            {definition.kind === "remove-line-breaks" && (
              <label className="option-line">
                <input type="checkbox" checked={compactParagraphs} onChange={(event) => setCompactParagraphs(event.target.checked)} />
                Preserve paragraph gaps
              </label>
            )}
            {definition.kind === "reverse" && (
              <label className="option-line">
                <input type="checkbox" checked={compactParagraphs} onChange={(event) => setCompactParagraphs(event.target.checked)} />
                Reverse line by line
              </label>
            )}
            {definition.kind === "repeater" && (
              <div className="text-form-grid">
                <input
                  className="text-tool-inline-input"
                  type="number"
                  min={1}
                  max={1000}
                  value={repeatCount}
                  onChange={(event) => setRepeatCount(Number(event.target.value) || 1)}
                  placeholder="Repeat count"
                />
                <input
                  className="text-tool-inline-input"
                  value={repeatSeparator}
                  onChange={(event) => setRepeatSeparator(event.target.value)}
                  placeholder="Separator (\n for newline)"
                />
              </div>
            )}
            {definition.kind === "morse" && (
              <div className="case-actions">
                <button className="secondary-button" type="button" onClick={() => setMorseDirection("to")} disabled={morseDirection === "to"}>
                  Text → Morse
                </button>
                <button className="secondary-button" type="button" onClick={() => setMorseDirection("from")} disabled={morseDirection === "from"}>
                  Morse → Text
                </button>
              </div>
            )}
            <div className="text-tool-action-row">
              <button className="button-primary tool-run-button" type="button" onClick={runAction} disabled={!text}>
                <Sparkles size={16} aria-hidden="true" />
                Run
              </button>
            </div>
          </div>
        )}

        {definition.kind === "lorem" && (
          <div className="text-tool-panel action-panel">
            <div className="text-form-grid text-form-grid-single">
              <label className="option-line">
                Paragraphs
                <input className="text-tool-inline-input" type="number" min={1} max={20} value={summarySentences} onChange={(event) => setSummarySentences(Number(event.target.value) || 1)} />
              </label>
            </div>
            <div className="text-tool-action-row">
              <button className="button-primary tool-run-button" type="button" onClick={runAction}>
                <Sparkles size={16} aria-hidden="true" />
                Generate
              </button>
            </div>
          </div>
        )}

        {definition.kind === "random" && (
          <div className="text-tool-panel action-panel">
            <div className="case-actions">
              <button className="secondary-button" type="button" onClick={() => setRandomMode("words")} disabled={randomMode === "words"}>
                Words
              </button>
              <button className="secondary-button" type="button" onClick={() => setRandomMode("sentences")} disabled={randomMode === "sentences"}>
                Sentences
              </button>
              <button className="secondary-button" type="button" onClick={() => setRandomMode("password")} disabled={randomMode === "password"}>
                Password
              </button>
            </div>
            {randomMode === "password" ? (
              <input
                className="text-tool-inline-input"
                type="number"
                min={6}
                max={128}
                value={passwordLength}
                onChange={(event) => setPasswordLength(Number(event.target.value) || 6)}
                placeholder="Password length"
              />
            ) : (
              <input
                className="text-tool-inline-input"
                type="number"
                min={1}
                max={200}
                value={randomCount}
                onChange={(event) => setRandomCount(Number(event.target.value) || 1)}
                placeholder={randomMode === "words" ? "Word count" : "Sentence count"}
              />
            )}
            <div className="text-tool-action-row">
              <button className="button-primary tool-run-button" type="button" onClick={runAction}>
                <Sparkles size={16} aria-hidden="true" />
                Generate
              </button>
            </div>
          </div>
        )}

        {definition.kind === "speech" && toolId === "text-to-speech" && (
          <div className="text-tool-panel action-panel">
            <div className="text-form-grid text-form-grid-single">
              <label className="option-line">
                Speech rate ({speechRate.toFixed(1)}x)
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={speechRate}
                  onChange={(event) => setSpeechRate(Number(event.target.value))}
                />
              </label>
            </div>
            <div className="case-actions">
              <button className="secondary-button" type="button" onClick={speakText} disabled={!text || isSpeaking}>
                <Play size={15} aria-hidden="true" />
                Speak
              </button>
              <button className="secondary-button" type="button" onClick={stopSpeaking} disabled={!isSpeaking}>
                <Square size={15} aria-hidden="true" />
                Stop
              </button>
            </div>
          </div>
        )}

        {definition.kind === "speech" && toolId === "speech-to-text" && (
          <div className="text-tool-panel action-panel">
            <div className="case-actions">
              <button className="secondary-button" type="button" onClick={startListening} disabled={!speechSupported || isListening}>
                <Mic size={15} aria-hidden="true" />
                Start listening
              </button>
              <button className="secondary-button" type="button" onClick={stopListening} disabled={!isListening}>
                <Square size={15} aria-hidden="true" />
                Stop
              </button>
            </div>
            {!speechSupported && (
              <p className="tool-limitation">Speech recognition is unavailable in this browser.</p>
            )}
          </div>
        )}

        {definition.kind === "crypto" && (
          <div className="text-tool-panel action-panel">
            <input
              className="text-tool-inline-input"
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder="Passphrase"
            />
            <div className="case-actions">
              <button className="secondary-button" type="button" onClick={runEncrypt} disabled={!text || !passphrase}>
                Encrypt
              </button>
              <button className="secondary-button" type="button" onClick={runDecrypt} disabled={!text || !passphrase}>
                Decrypt
              </button>
            </div>
          </div>
        )}

        {definition.kind === "readability" && (
          <div className="text-metrics" aria-label="Readability statistics">
            <div className="text-metric">
              <span>Reading ease</span>
              <strong>{readability.readingEase.toFixed(1)}</strong>
            </div>
            <div className="text-metric">
              <span>Grade level</span>
              <strong>{readability.gradeLevel.toFixed(1)}</strong>
            </div>
            <div className="text-metric">
              <span>Words / sentence</span>
              <strong>{readability.avgWordsPerSentence.toFixed(1)}</strong>
            </div>
            <p className="tool-feedback">{scoreLabel(readability.readingEase)} · Estimated read time {Math.max(1, Math.ceil(readability.estimatedReadingTimeMinutes))} min</p>
          </div>
        )}

        {definition.kind === "palindrome" && text && (
          <p className="tool-feedback" aria-live="polite">
            {palindrome ? "This text is a palindrome." : "This text is not a palindrome."}
          </p>
        )}

        {definition.kind === "unicode" && (
          <div className="text-tool-panel result-panel">
            <div className="text-tool-panel-heading">
              <span>Unicode details ({unicodeRows.length} shown)</span>
            </div>
            <div className="unicode-table">
              {unicodeRows.map((entry, index) => (
                <div key={`${entry.codePoint}-${index}`} className="unicode-row">
                  <strong>{entry.char || " "}</strong>
                  <span>{entry.codePoint}</span>
                  <span>{entry.utf16}</span>
                  <span>{entry.nameHint}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {definition.kind === "markdown" && (
          <div className="text-tool-panel result-panel">
            <div className="text-tool-panel-heading">
              <span>Preview</span>
            </div>
            <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: markdownHtml }} />
          </div>
        )}

        {needsMainResult && (
          <div className="text-tool-panel result-panel">
            <div className="text-tool-panel-heading">
              <label htmlFor="text-tool-result">Result</label>
              <button className="tool-quiet-button" type="button" onClick={copyResult} disabled={!result}>
                {copySucceeded ? <Check size={15} aria-hidden="true" /> : <Clipboard size={15} aria-hidden="true" />}
                {copySucceeded ? "Copied" : "Copy"}
              </button>
            </div>
            <textarea
              className="text-tool-input text-tool-output"
              id="text-tool-result"
              aria-label="Transformed text result"
              placeholder="Run the tool to see output…"
              value={result}
              onChange={(event) => setResult(event.target.value)}
              spellCheck
            />
          </div>
        )}

        {message && (
          <p className="tool-feedback" aria-live="polite" role="status">
            {message}
          </p>
        )}
      </section>

      <aside className="text-tool-aside">
        <div className="tool-info-card text-privacy-card">
          <span className="tool-info-icon">
            <ShieldCheck size={17} aria-hidden="true" />
          </span>
          <h2>Private processing</h2>
          <p>Your text stays in this browser and is not uploaded.</p>
        </div>
        {toolId === "sentence-counter" && (
          <p className="tool-limitation">
            Sentence counts use common punctuation (. ! ?). Abbreviations such as “e.g.” may count as more than one sentence.
          </p>
        )}
        {toolId === "text-encryptor-and-decryptor" && (
          <p className="tool-limitation">
            Keep your passphrase safe. Without it, encrypted text cannot be recovered.
          </p>
        )}
      </aside>
    </div>
  );
}
