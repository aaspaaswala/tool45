# Toolbox

An all-in-one online tools platform, being built incrementally with Next.js,
the App Router, React, and strict TypeScript.

## Current foundation

- Responsive homepage, navigation, search, and category browsing
- One typed registry for 247 tools across 10 categories
- Word Counter, Character Counter, Sentence Counter, Case Converter, and
  Remove Extra Spaces work in the browser
- 42 browser-based image and document-utility workflows
- Tools without implemented workflows are clearly marked as planned
- About, Contact, Privacy Policy, Terms, and Disclaimer routes
- Page metadata, canonical category URLs, `sitemap.xml`, and `robots.txt`
- Accessible skip link, navigation labels, focus states, and reduced-motion
  support

Three overlapping entries from the supplied catalog are consolidated:
photo resizing by KB, PDF page extraction, and PDF page reordering. Watermark
removal is intentionally not offered because removing visible marks can
remove a creator's attribution or rights notice.

Image workflows use browser canvas or local decoding. They are not uploaded to
the app. Background removal is limited to near-uniform backgrounds; it is not
AI subject segmentation. AVIF output depends on browser support. HEIC, TIFF,
QR, and PDF workflows use locally loaded browser libraries.

Image workflows include a reorderable multi-image queue, aspect-ratio-aware
resizing, crop-ratio presets, and configurable ID photo sheets. Preview and
output remain local to the browser.

## Requirements

- Node.js 20.9 or newer
- npm

## Run locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SITE_URL` in `.env.local` to the canonical public origin
before deployment. When unset, local development uses `http://localhost:3000`.

## Checks

```powershell
npm run typecheck
npm run build
```

## Next stage

Implement and test tools individually before changing their registry status
to `available`. File workflows should document their processing location,
validation, size limits, and cleanup behavior.
