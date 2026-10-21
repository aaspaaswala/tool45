import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ToolCard } from "@/components/tool-card";
import { ToolSearch } from "@/components/tool-search";
import { categories, tools } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "Search tools",
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const normalized = query.toLowerCase();

  const results = normalized
    ? tools
        .filter((tool) => {
          const category = categories.find((entry) => entry.id === tool.categoryId);
          return [tool.name, tool.description, ...tool.keywords, category?.name ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        })
        .sort((a, b) => {
          const rank = (name: string) =>
            name === normalized ? 0 : name.startsWith(normalized) ? 1 : 2;
          return (
            rank(a.name.toLowerCase()) - rank(b.name.toLowerCase()) ||
            Number(b.status === "available") - Number(a.status === "available")
          );
        })
    : [];

  return (
    <main className="page-shell listing-page" id="main-content">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <div className="search-page-field">
        <ToolSearch initialQuery={query} size="default" suggestions={false} />
      </div>
      <header className="page-heading">
        <h1>
          {query ? (
            <>
              Search results for “<span>{query}</span>”
            </>
          ) : (
            "Search tools"
          )}
        </h1>
        <p aria-live="polite">
          {query
            ? `${results.length} ${results.length === 1 ? "tool" : "tools"} found`
            : "Type a tool name, file type or task to get started."}
        </p>
      </header>
      {results.length > 0 ? (
        <div className="result-list">
          {results.slice(0, 40).map((tool) => (
            <ToolCard key={tool.id} tool={tool} variant="row" />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <SearchX size={32} aria-hidden="true" />
          <p>{query ? "No tools match your search." : "Nothing searched yet."}</p>
          <Link className="text-link" href="/categories">
            Browse all categories
          </Link>
        </div>
      )}
    </main>
  );
}
