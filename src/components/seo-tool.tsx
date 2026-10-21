"use client";

import { useState, type ReactNode } from "react";

import {
  seoToolDefinitions,
  type SeoToolId,
} from "@/lib/tools/seo-tool-config";

type Fields = Record<string, string>;
type DnsAnswer = { name: string; type: number; data: string; TTL: number };
type IpDetails = {
  ip?: string;
  city?: string;
  region?: string;
  country_name?: string;
  org?: string;
  error?: boolean;
  reason?: string;
};

const initialFields: Fields = {
  title: "A clear, helpful page title",
  description: "Describe what visitors will find on this page in a concise, useful way.",
  url: "https://example.com/page",
  image: "https://example.com/social-card.jpg",
  site: "Example",
  author: "",
  keywords: "",
  twitter: "",
  robots: "index, follow",
  source: "",
  urls: "",
  rules: "User-agent: *\nAllow: /",
  sitemap: "",
  html: "",
  canonical: "",
  schemaType: "WebSite",
  schemaData: '{\n  "name": "Example",\n  "url": "https://example.com/"\n}',
  questions: "",
  answers: "",
  response: "",
  links: "",
  campaignSource: "",
  campaignMedium: "",
  campaignName: "",
  campaignTerm: "",
  campaignContent: "",
  website: "https://example.com",
  pageSource: "",
  expectedHost: "",
  certificateHost: "",
  validUntil: "",
  domain: "",
  ip: "",
  locales: "en|https://example.com/\nes|https://example.com/es/",
  text: "",
  keyword: "",
  status: "",
  limit: "75",
};

const wordPattern = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;

function cleanPageText(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]*>/gu, " ")
    .replace(/&nbsp;|&#160;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/\s+/gu, " ")
    .trim();
}

function wordsIn(value: string): string[] {
  return value.toLocaleLowerCase().match(wordPattern) ?? [];
}

function toUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(/^[a-z][a-z\d+.-]*:/iu.test(trimmed) ? trimmed : `https://${trimmed}`);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/gu, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character] ?? character);
}

function attribute(tag: string, name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return tag.match(new RegExp(`\\b${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "iu"))?.slice(1).find(Boolean) ?? "";
}

function parseHttpStatus(text: string): number | null {
  const match = text.match(/^\s*HTTP\/\d(?:\.\d)?\s+(\d{3})\b/imu);
  return match ? Number(match[1]) : null;
}

function getOutput(toolId: SeoToolId, fields: Fields): string {
  const title = fields.title.trim();
  const description = fields.description.trim();
  const url = fields.url.trim();
  const image = fields.image.trim();
  const site = fields.site.trim();
  const tags: string[] = [];
  const escapeAttribute = (content: string) =>
    content.replace(/[&"<>]/gu, (character) => ({
      "&": "&amp;",
      '"': "&quot;",
      "<": "&lt;",
      ">": "&gt;",
    })[character] ?? character);
  const meta = (name: string, content: string) =>
    content ? `<meta name="${name}" content="${escapeAttribute(content)}">` : "";
  const property = (name: string, content: string) =>
    content ? `<meta property="${name}" content="${escapeAttribute(content)}">` : "";

  if (toolId === "meta-tag-generator") {
    if (title) tags.push(`<title>${escapeAttribute(title)}</title>`);
    tags.push(meta("description", description), meta("author", fields.author.trim()), meta("keywords", fields.keywords.trim()), meta("robots", fields.robots.trim()));
    if (toUrl(url)) tags.push(`<link rel="canonical" href="${escapeXml(toUrl(url)?.toString() ?? "")}">`);
    tags.push(property("og:title", title), property("og:description", description), property("og:url", toUrl(url)?.toString() ?? ""), property("og:image", toUrl(image)?.toString() ?? ""), property("og:site_name", site));
    if (fields.twitter.trim()) tags.push(meta("twitter:creator", fields.twitter.trim()));
    tags.push(meta("twitter:card", "summary_large_image"), meta("twitter:title", title), meta("twitter:description", description), meta("twitter:image", toUrl(image)?.toString() ?? ""));
    return tags.filter(Boolean).join("\n");
  }
  if (toolId === "open-graph-tag-generator") {
    return [
      property("og:type", "website"),
      property("og:title", title),
      property("og:description", description),
      property("og:url", toUrl(url)?.toString() ?? ""),
      property("og:image", toUrl(image)?.toString() ?? ""),
      property("og:site_name", site),
    ].filter(Boolean).join("\n");
  }
  if (toolId === "robots-txt-generator") {
    const lines = fields.rules.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
    const sitemap = toUrl(fields.sitemap);
    return [...lines, ...(sitemap ? [`Sitemap: ${sitemap.toString()}`] : [])].join("\n");
  }
  if (toolId === "xml-sitemap-generator") {
    const validUrls = fields.urls.split(/\r?\n/u).map((entry) => toUrl(entry)).filter((entry): entry is URL => entry !== null);
    if (!validUrls.length) return "";
    const today = new Date().toISOString().slice(0, 10);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${validUrls.map((entry) => `  <url>\n    <loc>${escapeXml(entry.toString())}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join("\n")}\n</urlset>`;
  }
  if (toolId === "schema-markup-generator") {
    try {
      const data: unknown = JSON.parse(fields.schemaData);
      if (!data || typeof data !== "object" || Array.isArray(data)) return "";
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": fields.schemaType,
        ...data,
      }, null, 2);
    } catch {
      return "";
    }
  }
  if (toolId === "faq-schema-generator") {
    const questions = fields.questions.split(/\r?\n/u).map((entry) => entry.trim()).filter(Boolean);
    const answers = fields.answers.split(/\r?\n/u).map((entry) => entry.trim()).filter(Boolean);
    if (questions.length === 0 || questions.length !== answers.length) return "";
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: questions.map((question, index) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answers[index] },
      })),
    }, null, 2);
  }
  if (toolId === "hreflang-generator") {
    return fields.locales.split(/\r?\n/u).map((line) => {
      const [locale, href] = line.split("|").map((part) => part?.trim() ?? "");
      const parsed = toUrl(href);
      return locale && parsed ? `<link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(parsed.toString())}">` : "";
    }).filter(Boolean).join("\n");
  }
  if (toolId === "utm-builder") {
    const parsed = toUrl(fields.url);
    if (!parsed) return "";
    const params: Array<[string, string]> = [
      ["utm_source", fields.campaignSource],
      ["utm_medium", fields.campaignMedium],
      ["utm_campaign", fields.campaignName],
      ["utm_term", fields.campaignTerm],
      ["utm_content", fields.campaignContent],
    ];
    for (const [key, value] of params) {
      if (value.trim()) parsed.searchParams.set(key, value.trim());
    }
    return parsed.toString();
  }
  if (toolId === "seo-slug-generator") {
    const normalized = fields.text.normalize("NFKD").replace(/[\u0300-\u036f]/gu, "").toLowerCase();
    const limit = Number.parseInt(fields.limit, 10);
    const slug = normalized
      .replace(/&/gu, " and ")
      .replace(/[^a-z0-9]+/gu, "-")
      .replace(/^-+|-+$/gu, "");
    return Number.isFinite(limit) && limit > 0 ? slug.slice(0, limit).replace(/-+$/u, "") : slug;
  }
  return "";
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="productivity-field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 6,
  placeholder,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  rows?: number;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="productivity-field">
      <span>{label}</span>
      <textarea rows={rows} value={value} placeholder={placeholder} readOnly={readOnly} onChange={onChange ? (event) => onChange(event.target.value) : undefined} />
    </label>
  );
}

function Result({ children }: { children: ReactNode }) {
  return <p className="productivity-notice" aria-live="polite">{children}</p>;
}

export function SeoTool({ toolId }: { toolId: SeoToolId }) {
  const [fields, setFields] = useState<Fields>(initialFields);
  const [message, setMessage] = useState("");
  const [dnsAnswers, setDnsAnswers] = useState<DnsAnswer[]>([]);
  const [ipDetails, setIpDetails] = useState<IpDetails | null>(null);
  const [busy, setBusy] = useState(false);

  const value = (key: string) => fields[key] ?? "";
  const update = (key: string, nextValue: string) =>
    setFields((current) => ({ ...current, [key]: nextValue }));
  const output = getOutput(toolId, fields);
  const parsedUrl = toUrl(value("url"));
  const cleanText = cleanPageText(value("text") || value("pageSource"));
  const wordList = wordsIn(cleanText);

  async function copyOutput() {
    if (!output) {
      setMessage("Add valid input to generate output before copying.");
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      setMessage("Copied to clipboard.");
    } catch {
      setMessage("Clipboard access was denied. Select the output and copy it manually.");
    }
  }

  async function lookupDns() {
    const domain = value("domain").trim().replace(/\.$/u, "");
    if (!domain || !/^(?=.{1,253}$)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)(?:\.(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?))+$/.test(domain)) {
      setMessage("Enter a valid domain name, such as example.com.");
      return;
    }
    setBusy(true);
    setMessage("");
    setDnsAnswers([]);
    try {
      const recordTypes = ["A", "AAAA", "CNAME", "MX", "NS", "TXT"];
      const responses = await Promise.all(recordTypes.map(async (type) => {
        const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
          headers: { accept: "application/dns-json" },
        });
        if (!response.ok) throw new Error(`DNS provider returned HTTP ${response.status}.`);
        const data = await response.json() as { Answer?: DnsAnswer[] };
        return (data.Answer ?? []).filter((answer) => answer.type !== 5 || type === "CNAME");
      }));
      setDnsAnswers(responses.flat());
      if (responses.every((records) => records.length === 0)) setMessage("No records were returned for these common record types.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "DNS lookup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function lookupIp() {
    const ip = value("ip").trim();
    if (!ip || !/^[\da-f:.]+$/iu.test(ip)) {
      setMessage("Enter a valid IPv4 or IPv6 address.");
      return;
    }
    setBusy(true);
    setMessage("");
    setIpDetails(null);
    try {
      const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
      if (!response.ok) throw new Error(`IP lookup provider returned HTTP ${response.status}.`);
      const data = await response.json() as IpDetails;
      if (data.error) throw new Error(data.reason || "The provider could not look up this IP address.");
      setIpDetails(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "IP lookup failed.");
    } finally {
      setBusy(false);
    }
  }

  let toolBody: ReactNode;
  switch (toolId) {
    case "meta-tag-generator":
    case "open-graph-tag-generator":
      toolBody = <>
        <div className="productivity-inline">
          <Field label="Page title" value={value("title")} onChange={(next) => update("title", next)} />
          <Field label="Canonical page URL" value={value("url")} onChange={(next) => update("url", next)} type="url" />
          <Field label="Description" value={value("description")} onChange={(next) => update("description", next)} />
          <Field label="Social image URL" value={value("image")} onChange={(next) => update("image", next)} type="url" />
          <Field label="Site name" value={value("site")} onChange={(next) => update("site", next)} />
          {toolId === "meta-tag-generator" && <>
            <Field label="Author" value={value("author")} onChange={(next) => update("author", next)} />
            <Field label="Keywords (comma separated)" value={value("keywords")} onChange={(next) => update("keywords", next)} />
            <Field label="Robots directive" value={value("robots")} onChange={(next) => update("robots", next)} />
            <Field label="Twitter/X creator handle" value={value("twitter")} onChange={(next) => update("twitter", next)} placeholder="@handle" />
          </>}
        </div>
      </>;
      break;
    case "serp-snippet-preview":
      toolBody = <>
        <div className="productivity-inline">
          <Field label="Title" value={value("title")} onChange={(next) => update("title", next)} />
          <Field label="Page URL" value={value("url")} onChange={(next) => update("url", next)} type="url" />
          <Field label="Description" value={value("description")} onChange={(next) => update("description", next)} />
        </div>
        <article className="seo-serp-preview">
          <span>{parsedUrl?.hostname || "example.com"}</span>
          <strong>{value("title").trim() || "Your page title"}</strong>
          <p>{parsedUrl?.toString() || "https://example.com/page"}</p>
          <p>{value("description").trim() || "Your page description will appear here."}</p>
          <small>Preview only. Search engines may rewrite titles and snippets.</small>
        </article>
      </>;
      break;
    case "keyword-density-checker":
      {
        const counts = new Map<string, number>();
        for (const word of wordsIn(value("text"))) counts.set(word, (counts.get(word) ?? 0) + 1);
        const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
        toolBody = <>
          <TextArea label="Text to analyze" value={value("text")} onChange={(next) => update("text", next)} rows={10} />
          <p className="productivity-muted">{wordsIn(value("text")).length} words · {value("text").length} characters</p>
          {rows.length ? <div className="seo-table-wrap"><table className="seo-table"><thead><tr><th>Word</th><th>Count</th><th>Density</th></tr></thead><tbody>{rows.map(([word, count]) => <tr key={word}><td>{word}</td><td>{count}</td><td>{((count / wordsIn(value("text")).length) * 100).toFixed(1)}%</td></tr>)}</tbody></table></div> : <Result>Enter or paste text to see word frequency.</Result>}
        </>;
      }
      break;
    case "robots-txt-generator":
      toolBody = <>
        <TextArea label="Robots directives" value={value("rules")} onChange={(next) => update("rules", next)} rows={5} placeholder={"User-agent: *\nDisallow: /private/"} />
        <Field label="Sitemap URL (optional)" value={value("sitemap")} onChange={(next) => update("sitemap", next)} type="url" />
      </>;
      break;
    case "xml-sitemap-generator":
      toolBody = <>
        <TextArea label="Page URLs (one per line)" value={value("urls")} onChange={(next) => update("urls", next)} rows={8} placeholder={"https://example.com/\nhttps://example.com/about"} />
        <Result>{value("urls").split(/\r?\n/u).filter((line) => line.trim() && !toUrl(line)).length ? "Invalid URL lines are skipped. Use absolute HTTP or HTTPS URLs." : "Each valid URL is included with today's last-modified date."}</Result>
      </>;
      break;
    case "canonical-tag-checker":
      {
        const canonicalTags = value("html").match(/<link\b[^>]*>/giu)?.filter((tag) => /\brel\s*=\s*(?:"[^"]*\bcanonical\b[^"]*"|'[^']*\bcanonical\b[^']*'|canonical)/iu.test(tag)) ?? [];
        const canonicals = canonicalTags.map((tag) => attribute(tag, "href")).filter(Boolean);
        const pageUrl = toUrl(value("url"));
        toolBody = <>
          <Field label="Page URL (optional)" value={value("url")} onChange={(next) => update("url", next)} type="url" />
          <TextArea label="Paste page HTML source" value={value("html")} onChange={(next) => update("html", next)} rows={8} placeholder={'<link rel="canonical" href="https://example.com/page">'} />
          {!value("html").trim() ? <Result>Paste HTML source to inspect canonical link tags.</Result> : canonicals.length === 0 ? <Result>No canonical link tag was found.</Result> : <Result>{canonicals.length > 1 ? `Found ${canonicals.length} canonical tags; pages should generally declare one.` : "Found one canonical tag."}{canonicals.map((href, index) => <span className="seo-output-line" key={`${href}-${index}`}>{href}{pageUrl && pageUrl.toString() === toUrl(href)?.toString() ? " — matches page URL" : ""}</span>)}</Result>}
        </>;
      }
      break;
    case "open-graph-preview":
    case "twitter-card-preview":
      toolBody = <>
        <div className="productivity-inline">
          <Field label="Title" value={value("title")} onChange={(next) => update("title", next)} />
          <Field label="Page URL" value={value("url")} onChange={(next) => update("url", next)} type="url" />
          <Field label="Description" value={value("description")} onChange={(next) => update("description", next)} />
          <Field label="Image URL" value={value("image")} onChange={(next) => update("image", next)} type="url" />
          <Field label="Site name" value={value("site")} onChange={(next) => update("site", next)} />
        </div>
        <article className="seo-social-preview">
          {toUrl(value("image")) && <img src={toUrl(value("image"))?.toString()} alt="" />}
          <div>
            <small>{toolId === "twitter-card-preview" ? `@${value("site").toLowerCase().replace(/\s+/gu, "")}` : value("site")}</small>
            <strong>{value("title") || "Your social card title"}</strong>
            <p>{value("description") || "Your social card description will appear here."}</p>
            <small>{toUrl(value("url"))?.hostname || "example.com"}</small>
          </div>
        </article>
        <p className="productivity-muted">The image is loaded directly from the URL you entered. Preview dimensions may differ across platforms.</p>
      </>;
      break;
    case "schema-markup-generator":
      {
        let schemaError = "";
        try {
          const parsed: unknown = JSON.parse(value("schemaData"));
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) schemaError = "Enter a JSON object for the schema properties.";
        } catch (error) {
          schemaError = error instanceof Error ? error.message : "Invalid JSON.";
        }
        toolBody = <>
          <label className="productivity-field"><span>Schema type</span><select value={value("schemaType")} onChange={(event) => update("schemaType", event.target.value)}>{["WebSite", "Organization", "LocalBusiness", "Article", "Product", "Event", "BreadcrumbList"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <TextArea label="Schema properties (JSON object)" value={value("schemaData")} onChange={(next) => update("schemaData", next)} rows={8} />
          {schemaError && <Result>{schemaError}</Result>}
        </>;
      }
      break;
    case "faq-schema-generator":
      toolBody = <>
        <div className="productivity-inline">
          <TextArea label="Questions (one per line)" value={value("questions")} onChange={(next) => update("questions", next)} rows={6} />
          <TextArea label="Answers in the same order (one per line)" value={value("answers")} onChange={(next) => update("answers", next)} rows={6} />
        </div>
        <Result>Provide the same number of non-empty questions and answers. Only publish FAQs visible to visitors.</Result>
      </>;
      break;
    case "redirect-checker":
    case "url-status-checker":
      {
        const responseStatus = parseHttpStatus(value("response"));
        const locations = value("response").match(/^\s*Location:\s*(.+)\s*$/gimu)?.map((line) => line.replace(/^\s*Location:\s*/iu, "").trim()) ?? [];
        toolBody = <>
          {toolId === "url-status-checker" && <Field label="URL to validate" value={value("url")} onChange={(next) => update("url", next)} type="url" />}
          <TextArea label="Paste HTTP response headers or redirect trace" value={value("response")} onChange={(next) => update("response", next)} rows={7} placeholder={"HTTP/1.1 301 Moved Permanently\nLocation: https://example.com/new-page"} />
          {toolId === "url-status-checker" && <Result>{value("url").trim() ? parsedUrl ? `Valid ${parsedUrl.protocol.replace(":", "").toUpperCase()} URL: ${parsedUrl.hostname}` : "Enter a valid HTTP or HTTPS URL." : "Enter a URL to validate. To inspect its response, paste the status line and headers above."}{responseStatus ? ` HTTP status: ${responseStatus}.` : ""}</Result>}
          {toolId === "redirect-checker" && <Result>{responseStatus ? `HTTP ${responseStatus}${responseStatus >= 300 && responseStatus < 400 ? " indicates a redirect." : " response."}` : "Paste a response starting with an HTTP status line to inspect it."}{locations.map((location, index) => <span className="seo-output-line" key={`${location}-${index}`}>Redirect target: {location}</span>)}</Result>}
        </>;
      }
      break;
    case "broken-link-checker":
      {
        const anchors = value("html").match(/<(?:a|img|script|link)\b[^>]*>/giu) ?? [];
        const base = toUrl(value("url"));
        const checked = anchors.map((tag) => {
          const isImage = /^<img\b/iu.test(tag);
          const target = attribute(tag, isImage ? "src" : "href");
          if (!target) return { target: "(missing target)", reason: "Missing href or src" };
          if (/^(?:mailto:|tel:|javascript:|data:)/iu.test(target) || target.startsWith("#")) return null;
          try {
            const resolved = base ? new URL(target, base) : new URL(target);
            return resolved.protocol === "http:" || resolved.protocol === "https:" ? null : { target, reason: "Unsupported URL scheme" };
          } catch {
            return { target, reason: "Invalid URL" };
          }
        }).filter((entry): entry is { target: string; reason: string } => entry !== null);
        toolBody = <>
          <Field label="Page URL (for relative links)" value={value("url")} onChange={(next) => update("url", next)} type="url" />
          <TextArea label="Paste page HTML source" value={value("html")} onChange={(next) => update("html", next)} rows={9} />
          <Result>{anchors.length} link/image tags inspected. This offline check validates URL syntax only; it does not request external pages.{checked.map((entry, index) => <span className="seo-output-line" key={`${entry.target}-${index}`}>{entry.reason}: {entry.target}</span>)}</Result>
        </>;
      }
      break;
    case "utm-builder":
      toolBody = <>
        <Field label="Destination URL" value={value("url")} onChange={(next) => update("url", next)} type="url" />
        <div className="productivity-inline">
          <Field label="Campaign source" value={value("campaignSource")} onChange={(next) => update("campaignSource", next)} placeholder="newsletter" />
          <Field label="Campaign medium" value={value("campaignMedium")} onChange={(next) => update("campaignMedium", next)} placeholder="email" />
          <Field label="Campaign name" value={value("campaignName")} onChange={(next) => update("campaignName", next)} placeholder="spring-launch" />
          <Field label="Campaign term (optional)" value={value("campaignTerm")} onChange={(next) => update("campaignTerm", next)} />
          <Field label="Campaign content (optional)" value={value("campaignContent")} onChange={(next) => update("campaignContent", next)} />
        </div>
      </>;
      break;
    case "favicon-preview":
      {
        const website = toUrl(value("website"));
        const candidates = website ? ["/favicon.ico", "/favicon.png", "/apple-touch-icon.png"].map((path) => new URL(path, website).toString()) : [];
        const faviconMarkup = website ? [
          `<link rel="icon" href="${escapeXml(new URL("/favicon.ico", website).toString())}">`,
          `<link rel="icon" type="image/png" href="${escapeXml(new URL("/favicon.png", website).toString())}">`,
          `<link rel="apple-touch-icon" href="${escapeXml(new URL("/apple-touch-icon.png", website).toString())}">`,
        ].join("\n") : "";
        toolBody = <>
          <Field label="Website URL" value={value("website")} onChange={(next) => update("website", next)} type="url" />
          <Result>Favicon candidates are requested directly from the website. Missing images may appear as broken previews.</Result>
          {candidates.map((candidate) => <div className="seo-favicon-row" key={candidate}><img src={candidate} alt="" /><code>{candidate}</code></div>)}
          <TextArea label="Suggested favicon markup" value={faviconMarkup} readOnly rows={3} />
        </>;
      }
      break;
    case "website-screenshot":
      {
        const website = toUrl(value("website"));
        toolBody = <>
          <Field label="Website URL" value={value("website")} onChange={(next) => update("website", next)} type="url" />
          <Result>The site is loaded in a restricted, script-disabled frame. Some websites block embedding; this preview cannot capture a downloadable screenshot.</Result>
          {website && <iframe className="seo-site-frame" src={website.toString()} title={`Preview of ${website.hostname}`} sandbox="" referrerPolicy="no-referrer" loading="lazy" />}
        </>;
      }
      break;
    case "page-size-checker":
      {
        const bytes = new TextEncoder().encode(value("pageSource")).byteLength;
        toolBody = <>
          <TextArea label="Paste page source or response content" value={value("pageSource")} onChange={(next) => update("pageSource", next)} rows={11} />
          <p className="productivity-result">{bytes.toLocaleString()} bytes <span className="seo-subresult">({(bytes / 1024).toFixed(2)} KiB)</span></p>
          <p className="productivity-muted">Measures UTF-8 bytes of pasted content only. It does not include transfer compression or image and script assets.</p>
        </>;
      }
      break;
    case "http-header-checker":
      {
        const headers = new Map<string, string>(value("response").split(/\r?\n/u).map((line): [string, string] => {
          const colon = line.indexOf(":");
          return colon > 0 ? [line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim()] : ["", ""];
        }).filter(([name]) => Boolean(name)));
        const checkedHeaders = ["strict-transport-security", "content-security-policy", "x-content-type-options", "referrer-policy", "permissions-policy"];
        toolBody = <>
          <TextArea label="Paste HTTP response headers" value={value("response")} onChange={(next) => update("response", next)} rows={10} placeholder={"HTTP/2 200\ncontent-type: text/html\nstrict-transport-security: max-age=31536000"} />
          <p className="productivity-muted">{parseHttpStatus(value("response")) ? `Response status: HTTP ${parseHttpStatus(value("response"))}` : "Include an HTTP status line if available."}</p>
          <ul className="seo-check-list">{checkedHeaders.map((name) => <li key={name}><strong>{name}</strong><span>{headers.has(name) ? headers.get(name) : "Not present in pasted headers"}</span></li>)}</ul>
          <p className="productivity-muted">This is a local review of the headers you paste; it does not contact the website.</p>
        </>;
      }
      break;
    case "ssl-certificate-checker":
      {
        const expectedHost = value("expectedHost").trim().toLowerCase().replace(/\.$/u, "");
        const certificateHost = value("certificateHost").trim().toLowerCase().replace(/^\*\./u, "").replace(/\.$/u, "");
        const expiry = value("validUntil") ? new Date(value("validUntil")) : null;
        const expired = expiry && !Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now();
        const hostMatches = expectedHost && certificateHost && (expectedHost === certificateHost || (value("certificateHost").startsWith("*.") && expectedHost.endsWith(`.${certificateHost}`)));
        toolBody = <>
          <div className="productivity-inline">
            <Field label="Expected hostname" value={value("expectedHost")} onChange={(next) => update("expectedHost", next)} placeholder="www.example.com" />
            <Field label="Certificate hostname (CN/SAN)" value={value("certificateHost")} onChange={(next) => update("certificateHost", next)} placeholder="example.com or *.example.com" />
            <Field label="Certificate valid until" value={value("validUntil")} onChange={(next) => update("validUntil", next)} type="date" />
          </div>
          <Result>{!value("expectedHost") || !value("certificateHost") || !value("validUntil") ? "Enter the hostname and expiry date from the certificate details to check them." : Number.isNaN(expiry?.getTime()) ? "Enter a valid certificate expiry date." : `${hostMatches ? "Hostname matches." : "Hostname does not match."} ${expired ? "Certificate is expired." : "Certificate expiry date is in the future."}`}</Result>
          <p className="productivity-muted">For privacy and browser security, this page cannot inspect a remote server's TLS certificate directly. Check the certificate details shown by your browser and enter them above.</p>
        </>;
      }
      break;
    case "dns-lookup":
      toolBody = <>
        <Field label="Domain name" value={value("domain")} onChange={(next) => update("domain", next)} placeholder="example.com" />
        <div className="productivity-actions"><button className="button-primary" type="button" disabled={busy} onClick={lookupDns}>{busy ? "Looking up…" : "Look up DNS records"}</button></div>
        <p className="productivity-muted">The entered domain is sent to Cloudflare DNS over HTTPS. Records requested: A, AAAA, CNAME, MX, NS, and TXT.</p>
        {message && <Result>{message}</Result>}
        {dnsAnswers.length > 0 && <div className="seo-table-wrap"><table className="seo-table"><thead><tr><th>Type</th><th>Record</th><th>TTL</th></tr></thead><tbody>{dnsAnswers.map((answer, index) => <tr key={`${answer.type}-${answer.data}-${index}`}><td>{({ 1: "A", 5: "CNAME", 15: "MX", 16: "TXT", 28: "AAAA", 2: "NS" } as Record<number, string>)[answer.type] ?? answer.type}</td><td>{answer.data}</td><td>{answer.TTL}s</td></tr>)}</tbody></table></div>}
      </>;
      break;
    case "ip-address-lookup":
      toolBody = <>
        <Field label="Public IP address" value={value("ip")} onChange={(next) => update("ip", next)} placeholder="203.0.113.10" />
        <div className="productivity-actions"><button className="button-primary" type="button" disabled={busy} onClick={lookupIp}>{busy ? "Looking up…" : "Look up IP address"}</button></div>
        <p className="productivity-muted">The entered IP address is sent to ipapi.co for geolocation and network information.</p>
        {message && <Result>{message}</Result>}
        {ipDetails && <ul className="seo-check-list">{[["IP address", ipDetails.ip], ["City", ipDetails.city], ["Region", ipDetails.region], ["Country", ipDetails.country_name], ["Network", ipDetails.org]].map(([label, detail]) => <li key={label}><strong>{label}</strong><span>{detail || "Not provided"}</span></li>)}</ul>}
      </>;
      break;
    case "hreflang-generator":
      toolBody = <>
        <TextArea label="Language code | absolute page URL (one pair per line)" value={value("locales")} onChange={(next) => update("locales", next)} rows={7} placeholder={"en|https://example.com/\nfr|https://example.com/fr/"} />
        <p className="productivity-muted">Use valid language-region codes such as en, en-US, or fr. Each locale should link to the equivalent page.</p>
      </>;
      break;
    case "seo-slug-generator":
      toolBody = <>
        <TextArea label="Title or phrase" value={value("text")} onChange={(next) => update("text", next)} rows={4} placeholder="A Useful Guide to Search Engine Optimization" />
        <Field label="Maximum characters (0 or blank for no limit)" value={value("limit")} onChange={(next) => update("limit", next)} type="number" />
      </>;
      break;
    case "website-word-counter":
      toolBody = <>
        <TextArea label="Paste page text or HTML source" value={value("text")} onChange={(next) => update("text", next)} rows={10} placeholder="Paste visible page text or the HTML source to analyze." />
        <div className="seo-stat-grid"><p><strong>{wordList.length.toLocaleString()}</strong><span>Words</span></p><p><strong>{cleanText.length.toLocaleString()}</strong><span>Characters</span></p><p><strong>{cleanText ? cleanText.split(/\s+/u).length.toLocaleString() : "0"}</strong><span>Tokens</span></p><p><strong>{cleanText ? Math.ceil(wordList.length / 200) : "0"}</strong><span>Reading minutes</span></p></div>
        <p className="productivity-muted">Analysis runs in your browser. HTML tags, scripts, and styles are excluded from the count.</p>
      </>;
      break;
    default:
      toolBody = <Result>This tool is not configured.</Result>;
  }

  const hasGeneratedOutput = ["meta-tag-generator", "open-graph-tag-generator", "robots-txt-generator", "xml-sitemap-generator", "schema-markup-generator", "faq-schema-generator", "hreflang-generator", "utm-builder", "seo-slug-generator"].includes(toolId);
  const schemaInvalid = toolId === "schema-markup-generator" && !output;
  const faqPartsMatch = toolId !== "faq-schema-generator" || (value("questions").split(/\r?\n/u).filter((line) => line.trim()).length === value("answers").split(/\r?\n/u).filter((line) => line.trim()).length);

  return (
    <section className="productivity-panel" aria-label={`${seoToolDefinitions[toolId].title} workspace`}>
      <p className="productivity-private">Text stays in your browser; website previews and lookups send requests to the entered URL or named provider.</p>
      {toolBody}
      {hasGeneratedOutput && <>
        {toolId === "schema-markup-generator" && schemaInvalid && <Result>Enter a valid JSON object to generate schema markup.</Result>}
        {toolId === "faq-schema-generator" && !faqPartsMatch && <Result>Question and answer counts must match before output can be generated.</Result>}
        <TextArea label="Generated output" value={output} readOnly rows={8} placeholder="Generated markup will appear here." />
        <div className="productivity-actions"><button className="secondary-button" type="button" onClick={copyOutput}>Copy output</button></div>
      </>}
      {message && !["dns-lookup", "ip-address-lookup"].includes(toolId) && <Result>{message}</Result>}
    </section>
  );
}
