import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Faq } from "@/components/faq";
import { RelatedTools } from "@/components/related-tools";
import { TextTool } from "@/components/text-tool";
import { ImageTool } from "@/components/image-tool";
import { categories, getCategory, getTool, getToolsForCategory, tools } from "@/lib/tools/registry";
import { getToolContent } from "@/lib/tools/tool-content";
import { getToolIcon, getToolTone } from "@/lib/tools/ui";
import { siteName, siteUrl } from "@/lib/site";
import { imageToolIntros, isImageToolId } from "@/lib/tools/image-tool-config";
import { PdfTool } from "@/components/pdf-tool";
import { isPdfToolId, pdfToolIntros } from "@/lib/tools/pdf-tool-config";
import { ProductivityTool } from "@/components/productivity-tool";
import { StudentTool } from "@/components/student-tool";
import { CalculatorTool } from "@/components/calculator-tool";
import { DeveloperTool } from "@/components/developer-tool";
import { SeoTool } from "@/components/seo-tool";
import {
  calculatorToolDefinitions,
  isCalculatorToolId,
} from "@/lib/tools/calculator-tool-config";
import {
  developerToolDefinitions,
  isDeveloperToolId,
} from "@/lib/tools/developer-tool-config";
import {
  isStudentToolId,
  studentToolDefinitions,
} from "@/lib/tools/student-tool-config";
import {
  isProductivityToolId,
  productivityToolDefinitions,
} from "@/lib/tools/productivity-tool-config";
import {
  isTextToolId,
  textToolDefinitions,
} from "@/lib/tools/text-tool-config";
import { isSeoToolId, seoToolDefinitions } from "@/lib/tools/seo-tool-config";

export function generateStaticParams() {
  return tools
    .filter((tool) => tool.status === "available")
    .map((tool) => ({ slug: tool.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.status !== "available") return {};
  if (!isTextToolId(slug) && !isImageToolId(slug) && !isPdfToolId(slug) && !isProductivityToolId(slug) && !isStudentToolId(slug) && !isCalculatorToolId(slug) && !isDeveloperToolId(slug) && !isSeoToolId(slug)) return {};
  const description = isImageToolId(slug)
    ? imageToolIntros[slug]
    : isPdfToolId(slug)
      ? pdfToolIntros[slug]
      : isProductivityToolId(slug)
        ? productivityToolDefinitions[slug].intro
        : isStudentToolId(slug)
          ? studentToolDefinitions[slug].intro
            : isCalculatorToolId(slug)
              ? calculatorToolDefinitions[slug].intro
              : isDeveloperToolId(slug)
                ? developerToolDefinitions[slug].intro
                : isSeoToolId(slug)
                  ? seoToolDefinitions[slug].intro
                  : textToolDefinitions[slug].intro;

  return {
    title: `${tool.name} Online`,
    description,
    alternates: { canonical: `/tools/${tool.id}` },
    openGraph: {
      title: `${tool.name} Online | ${siteName}`,
      description,
      url: `/tools/${tool.id}`,
      siteName,
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (
    !tool ||
    tool.status !== "available" ||
    (!isTextToolId(slug) && !isImageToolId(slug) && !isPdfToolId(slug) && !isProductivityToolId(slug) && !isStudentToolId(slug) && !isCalculatorToolId(slug) && !isDeveloperToolId(slug) && !isSeoToolId(slug))
  ) {
    notFound();
  }

  const category = getCategory(tool.categoryId);
  if (!category) notFound();

  const isImage = isImageToolId(slug);
  const isPdf = isPdfToolId(slug);
  const isProductivity = isProductivityToolId(slug);
  const isStudent = isStudentToolId(slug);
  const isCalculator = isCalculatorToolId(slug);
  const isDeveloper = isDeveloperToolId(slug);
  const isSeo = isSeoToolId(slug);
  const title = isImage || isPdf ? tool.name : isProductivity ? productivityToolDefinitions[slug].title : isStudent ? studentToolDefinitions[slug].title : isCalculator ? calculatorToolDefinitions[slug].title : isDeveloper ? developerToolDefinitions[slug].title : isSeo ? seoToolDefinitions[slug].title : textToolDefinitions[slug].title;
  const intro = isImage
    ? imageToolIntros[slug]
    : isPdf
      ? pdfToolIntros[slug]
      : isProductivity
        ? productivityToolDefinitions[slug].intro
        : isStudent
          ? studentToolDefinitions[slug].intro
          : isCalculator
            ? calculatorToolDefinitions[slug].intro
            : isDeveloper
              ? developerToolDefinitions[slug].intro
              : isSeo
                ? seoToolDefinitions[slug].intro
                : textToolDefinitions[slug].intro;
  const pageUrl = new URL(`/tools/${tool.id}`, siteUrl).toString();
  const categoryUrl = new URL(`/categories/${category.id}`, siteUrl).toString();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${pageUrl}#tool`,
        name: title,
        description: intro,
        url: pageUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        inLanguage: "en",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: new URL("/", siteUrl).toString(),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: category.name,
            item: categoryUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: title,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  const related = [
    ...getToolsForCategory(category.id).filter(
      (entry) => entry.id !== tool.id && entry.status === "available",
    ),
    ...tools.filter(
      (entry) =>
        entry.categoryId !== category.id && entry.status === "available",
    ),
  ].slice(0, 6);
  const content = getToolContent(tool);
  const { icon: ToolIcon, tone } = {
    icon: getToolIcon(tool),
    tone: getToolTone(tool),
  };

  return (
    <main className="tool-detail-page page-shell" id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: category.name, href: `/categories/${category.id}` },
          { label: tool.name },
        ]}
      />
      <header className={`tool-detail-heading tone-${tone}`}>
        <span className="icon-tile icon-tile-lg">
          <ToolIcon size={30} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </header>
      <div className="tool-page-grid">
        <div className="tool-page-main">
          {isImage ? (
            <ImageTool toolId={slug} />
          ) : isPdf ? (
            <PdfTool toolId={slug} />
          ) : isProductivity ? (
            <ProductivityTool toolId={slug} />
          ) : isStudent ? (
            <StudentTool toolId={slug} />
          ) : isCalculator ? (
            <CalculatorTool toolId={slug} />
          ) : isDeveloper ? (
            <DeveloperTool toolId={slug} />
          ) : isSeo ? (
            <SeoTool toolId={slug} />
          ) : (
            <TextTool toolId={slug} />
          )}
          <section className="content-card" aria-labelledby="how-to-title">
            <h2 id="how-to-title">How to use {tool.name}</h2>
            <ol className="how-list">
              {content.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
          <section className="content-card" aria-labelledby="faq-title">
            <h2 id="faq-title">Frequently asked questions</h2>
            <Faq items={content.faqs} />
          </section>
        </div>
        <aside className="tool-page-side" aria-label="Related tools">
          <RelatedTools tools={related} />
        </aside>
      </div>
    </main>
  );
}
