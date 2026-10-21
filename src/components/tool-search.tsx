"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { categories, tools } from "@/lib/tools/registry";
import { getToolIcon, getToolTone } from "@/lib/tools/ui";

interface ToolSearchProps {
  initialQuery?: string;
  suggestions?: boolean;
  size?: "large" | "default";
  autoFocus?: boolean;
}

export function ToolSearch({
  initialQuery = "",
  suggestions = true,
  size = "large",
  autoFocus = false,
}: ToolSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputId = useId();
  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!suggestions || !normalizedQuery) return [];
    return tools
      .filter((tool) => {
        const category = categories.find((entry) => entry.id === tool.categoryId);
        return [tool.name, ...tool.keywords, category?.name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => {
        const rank = (name: string) =>
          name === normalizedQuery ? 0 : name.startsWith(normalizedQuery) ? 1 : 2;
        const byRank = rank(a.name.toLowerCase()) - rank(b.name.toLowerCase());
        if (byRank) return byRank;
        return Number(b.status === "available") - Number(a.status === "available");
      })
      .slice(0, 5);
  }, [normalizedQuery, suggestions]);

  return (
    <div className="search-wrap">
      <form action="/search" className={`tool-search tool-search-${size}`} role="search">
        <Search size={20} aria-hidden="true" />
        <label className="visually-hidden" htmlFor={inputId}>
          Search tools
        </label>
        <input
          autoComplete="off"
          autoFocus={autoFocus}
          id={inputId}
          name="q"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for any tool… e.g. image resizer, word counter"
          type="search"
          value={query}
        />
        <button className="button-primary" type="submit">
          Search
        </button>
      </form>
      {suggestions && normalizedQuery && (
        <div
          aria-label="Search suggestions"
          aria-live="polite"
          className="search-results"
        >
          {results.length > 0 ? (
            results.map((tool) => {
              const Icon = getToolIcon(tool);
              return (
                <Link
                  className={`search-result tone-${getToolTone(tool)}`}
                  href={
                    tool.status === "available"
                      ? `/tools/${tool.id}`
                      : `/categories/${tool.categoryId}`
                  }
                  key={tool.id}
                >
                  <span className="icon-tile icon-tile-sm">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <strong>{tool.name}</strong>
                  <span className={`status-pill status-${tool.status}`}>
                    {tool.status === "available" ? "Free" : "Coming soon"}
                  </span>
                </Link>
              );
            })
          ) : (
            <p className="search-empty">No matching tools. Try a different search.</p>
          )}
          <Link className="search-all" href={`/search?q=${encodeURIComponent(query.trim())}`}>
            See all results for “{query.trim()}”
          </Link>
        </div>
      )}
    </div>
  );
}
