export const seoToolDefinitions = {
  "meta-tag-generator": {
    title: "Meta Tag Generator",
    intro: "Create SEO title, description, canonical, and social meta tags from your page details.",
  },
  "serp-snippet-preview": {
    title: "SERP Snippet Preview",
    intro: "Preview how a page title, URL, and description can appear in search results.",
  },
  "keyword-density-checker": {
    title: "Keyword Density Checker",
    intro: "Count words and review keyword frequency in text you provide.",
  },
  "robots-txt-generator": {
    title: "Robots.txt Generator",
    intro: "Build a robots.txt file with crawl rules and an optional sitemap URL.",
  },
  "xml-sitemap-generator": {
    title: "XML Sitemap Generator",
    intro: "Turn a list of page URLs into a valid XML sitemap.",
  },
  "canonical-tag-checker": {
    title: "Canonical Tag Checker",
    intro: "Inspect canonical link tags in HTML source you paste and compare their URLs.",
  },
  "open-graph-preview": {
    title: "Open Graph Preview",
    intro: "Preview a social card using the Open Graph values for your page.",
  },
  "twitter-card-preview": {
    title: "Twitter Card Preview",
    intro: "Preview a social card using Twitter/X card metadata.",
  },
  "schema-markup-generator": {
    title: "Schema Markup Generator",
    intro: "Validate and wrap JSON-LD structured data for a web page.",
  },
  "faq-schema-generator": {
    title: "FAQ Schema Generator",
    intro: "Create FAQPage JSON-LD from matching question and answer lists.",
  },
  "redirect-checker": {
    title: "Redirect Checker",
    intro: "Review a pasted HTTP response or redirect trace without sending requests to a server.",
  },
  "broken-link-checker": {
    title: "Broken Link Checker",
    intro: "Extract and validate links in pasted HTML source.",
  },
  "utm-builder": {
    title: "UTM Builder",
    intro: "Add campaign tracking parameters to a destination URL.",
  },
  "favicon-preview": {
    title: "Favicon Preview",
    intro: "Preview common favicon paths for a website and generate link markup.",
  },
  "website-screenshot": {
    title: "Website Screenshot",
    intro: "Preview a public website in a restricted frame; some sites block embedding.",
  },
  "page-size-checker": {
    title: "Page Size Checker",
    intro: "Measure the UTF-8 size of page source or response content you provide.",
  },
  "http-header-checker": {
    title: "HTTP Header Checker",
    intro: "Review pasted HTTP response headers and check common security headers.",
  },
  "ssl-certificate-checker": {
    title: "SSL Certificate Checker",
    intro: "Check certificate hostname and expiry details copied from your browser or certificate viewer.",
  },
  "dns-lookup": {
    title: "DNS Lookup",
    intro: "Look up common DNS records using Cloudflare DNS over HTTPS.",
  },
  "ip-address-lookup": {
    title: "IP Address Lookup",
    intro: "Look up public IP network details using ipapi.co.",
  },
  "hreflang-generator": {
    title: "Hreflang Generator",
    intro: "Generate alternate-language link tags from locale and URL pairs.",
  },
  "open-graph-tag-generator": {
    title: "Open Graph Tag Generator",
    intro: "Generate Open Graph meta tags from your page details.",
  },
  "seo-slug-generator": {
    title: "SEO Slug Generator",
    intro: "Convert a title or phrase into a clean, URL-friendly slug.",
  },
  "url-status-checker": {
    title: "URL Status Checker",
    intro: "Validate URL syntax and inspect a pasted HTTP status response.",
  },
  "website-word-counter": {
    title: "Website Word Counter",
    intro: "Count words in pasted website text or HTML source.",
  },
} as const;

export type SeoToolId = keyof typeof seoToolDefinitions;

export const seoToolIds = Object.keys(seoToolDefinitions) as SeoToolId[];

export function isSeoToolId(id: string): id is SeoToolId {
  return Object.hasOwn(seoToolDefinitions, id);
}
