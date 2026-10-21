import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  Layers,
  LayoutGrid,
  MousePointerClick,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Download,
  Zap,
  Wallet,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { CategoryCard } from "@/components/category-card";
import { SectionHeading } from "@/components/section-heading";
import { ToolCard } from "@/components/tool-card";
import { ToolSearch } from "@/components/tool-search";
import { categories, getTool, tools } from "@/lib/tools/registry";
import type { Tone } from "@/lib/tools/ui";
import type { ToolCategoryId } from "@/lib/tools/types";

const popularChips = [
  "image-resizer",
  "image-compressor",
  "word-counter",
  "image-format-converter",
  "case-converter",
  "background-remover",
];

const popularToolIds = [
  "image-resizer",
  "image-compressor",
  "image-cropper",
  "image-format-converter",
  "background-remover",
  "image-to-pdf",
  "word-counter",
  "case-converter",
];

const homeCategories: Array<{ id: ToolCategoryId; label: string }> = [
  { id: "image", label: "Image Tools" },
  { id: "pdf", label: "PDF Tools" },
  { id: "text", label: "Text Tools" },
  { id: "developer", label: "Developer Tools" },
  { id: "seo", label: "SEO Tools" },
  { id: "calculators", label: "Math Tools" },
  { id: "student", label: "Student Tools" },
  { id: "utilities", label: "Date & Time" },
  { id: "social-color", label: "Social Tools" },
];

const highlights: Array<{ icon: LucideIcon; title: string }> = [
  { icon: Layers, title: `${tools.length}+ Tools` },
  { icon: Wallet, title: "Free to use" },
  { icon: ShieldCheck, title: "Private in your browser" },
  { icon: Smartphone, title: "Works on every device" },
];

const steps: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: MousePointerClick, title: "Choose a tool", text: "Search or browse categories to find the tool you need." },
  { icon: Upload, title: "Add your input", text: "Upload a file or paste your text. Nothing to install." },
  { icon: Settings2, title: "Adjust the options", text: "Fine-tune settings with simple, clear controls." },
  { icon: Download, title: "Download the result", text: "Preview the output and save it in one click." },
];

const reasons: Array<{ icon: LucideIcon; tone: Tone; title: string; text: string }> = [
  { icon: Zap, tone: "amber", title: "Fast and lightweight", text: "Tools open instantly and run right in your browser." },
  { icon: ShieldCheck, tone: "green", title: "Private by design", text: "Image tools process files locally instead of uploading them." },
  { icon: Gauge, tone: "blue", title: "Clear and focused", text: "Every tool does one job well, with honest notes about limits." },
  { icon: Smartphone, tone: "violet", title: "Built for every screen", text: "Responsive, keyboard friendly and accessible." },
];

export const metadata: Metadata = {
  title: "TOOL45 – All the Online Tools You Need in One Place",
  description:
    "Free online tools for images, text, PDFs, developers and everyday tasks. Fast, private and works on every device.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TOOL45 – All the Online Tools You Need in One Place",
    description: "Free, fast and privacy-focused online tools. No account required.",
    url: "/",
  },
};

export default function HomePage() {
  const popularTools = popularToolIds
    .map((id) => getTool(id))
    .filter((tool) => tool !== undefined);

  return (
    <main id="main-content">
      <section className="hero">
        <div className="hero-inner">
          <span className="hero-badge">
            <Sparkles size={14} aria-hidden="true" />
            Free online tools for everyone
          </span>
          <h1>
            All the Online Tools You Need in <span>One Place</span>
          </h1>
          <ToolSearch />
          <div className="chip-row" aria-label="Popular tools">
            <span className="chip-label">Popular:</span>
            {popularChips.map((id) => {
              const tool = getTool(id);
              return tool ? (
                <Link className="chip" href={`/tools/${tool.id}`} key={id}>
                  {tool.name}
                </Link>
              ) : null;
            })}
          </div>
          <ul className="trust-row" aria-label="Highlights">
            {highlights.map(({ icon: Icon, title }) => (
              <li key={title}>
                <Icon size={16} aria-hidden="true" />
                {title}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section page-shell" aria-labelledby="categories-title">
        <SectionHeading
          action={{ href: "/categories", label: "View all categories" }}
          id="categories-title"
          title="Browse by category"
        />
        <div className="category-grid">
          {homeCategories.map(({ id, label }) => {
            const category = categories.find((entry) => entry.id === id)!;
            return (
              <CategoryCard
                category={category}
                key={id}
                label={label}
                toolCount={tools.filter((tool) => tool.categoryId === id).length}
              />
            );
          })}
          <Link className="category-card tone-blue category-card-all" href="/categories">
            <span className="icon-tile">
              <LayoutGrid size={24} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <strong>All Tools</strong>
            <small>{tools.length} tools</small>
          </Link>
        </div>
      </section>

      <section className="section section-muted" aria-labelledby="popular-title">
        <div className="page-shell">
          <SectionHeading
            action={{ href: "/categories", label: "Explore all tools" }}
            id="popular-title"
            title="Popular tools"
          />
          <div className="tool-grid tool-grid-4">
            {popularTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      <section className="section page-shell" aria-labelledby="how-title">
        <SectionHeading
          align="center"
          id="how-title"
          title="How it works"
        />
        <ol className="steps">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li className="step" key={title}>
              <span className="step-number">{index + 1}</span>
              <span className="icon-tile tone-blue">
                <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section section-muted" aria-labelledby="why-title">
        <div className="page-shell">
          <SectionHeading
            align="center"
            id="why-title"
            title="Why choose TOOL45"
          />
          <div className="reason-grid">
            {reasons.map(({ icon: Icon, tone, title, text }) => (
              <div className={`reason-card tone-${tone}`} key={title}>
                <span className="icon-tile">
                  <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell cta-section" aria-labelledby="cta-title">
        <div className="cta-card">
          <h2 id="cta-title">Ready to get things done?</h2>
          <p>Pick a tool and finish your task in seconds. No sign-up needed.</p>
          <div className="cta-actions">
            <Link className="button-primary" href="/categories">
              Explore all tools <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
