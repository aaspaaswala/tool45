import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { getToolIcon, getToolTone } from "@/lib/tools/ui";
import type { ToolDefinition } from "@/lib/tools/types";

export function RelatedTools({
  title = "Related tools",
  tools,
}: {
  title?: string;
  tools: ToolDefinition[];
}) {
  return (
    <section className="side-card" aria-labelledby="related-title">
      <h2 id="related-title">{title}</h2>
      <ul className="related-list">
        {tools.map((tool) => {
          const Icon = getToolIcon(tool);
          return (
            <li key={tool.id}>
              <Link
                className={`related-item tone-${getToolTone(tool)}`}
                href={tool.status === "available" ? `/tools/${tool.id}` : `/categories/${tool.categoryId}`}
              >
                <span className="icon-tile icon-tile-sm">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span>{tool.name}</span>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
