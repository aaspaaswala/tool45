"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { ToolCard } from "@/components/tool-card";
import type { ToolDefinition } from "@/lib/tools/types";

type Filter = "all" | "available" | "planned";

const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "available", label: "Ready to use" },
  { id: "planned", label: "Coming soon" },
];

export function CategoryToolList({ tools }: { tools: ToolDefinition[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const normalized = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      tools
        .filter((tool) => {
          if (filter === "available" && tool.status !== "available") return false;
          if (filter === "planned" && tool.status === "available") return false;
          if (!normalized) return true;
          return `${tool.name} ${tool.description} ${tool.keywords.join(" ")}`
            .toLowerCase()
            .includes(normalized);
        })
        .sort(
          (a, b) =>
            Number(b.status === "available") - Number(a.status === "available"),
        ),
    [tools, filter, normalized],
  );

  return (
    <>
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={18} aria-hidden="true" />
          <label className="visually-hidden" htmlFor="category-filter-search">
            Search in this category
          </label>
          <input
            id="category-filter-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search in this category…"
            type="search"
            value={query}
          />
        </div>
        <div className="segmented" role="group" aria-label="Filter tools by status">
          {filters.map((item) => (
            <button
              aria-pressed={filter === item.id}
              key={item.id}
              onClick={() => setFilter(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <p className="result-count" aria-live="polite">
        Showing {visible.length} of {tools.length} tools
      </p>
      {visible.length ? (
        <div className="tool-grid">
          {visible.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No tools match your filters.</p>
          <button
            className="secondary-button"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            type="button"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
