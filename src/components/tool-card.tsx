import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import { getToolIcon, getToolTone } from "@/lib/tools/ui";
import type { ToolDefinition } from "@/lib/tools/types";

interface ToolCardProps {
  tool: ToolDefinition;
  variant?: "card" | "row";
}

function statusLabel(status: ToolDefinition["status"]) {
  if (status === "available") return "Free";
  return status === "excluded" ? "Not offered" : "Coming soon";
}

export function ToolCard({ tool, variant = "card" }: ToolCardProps) {
  const Icon = getToolIcon(tool);
  const tone = getToolTone(tool);
  const available = tool.status === "available";
  const href = available ? `/tools/${tool.id}` : `/categories/${tool.categoryId}`;

  if (variant === "row") {
    return (
      <Link className={`tool-row tone-${tone}`} href={href}>
        <span className="icon-tile">
          <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="tool-row-body">
          <strong>{tool.name}</strong>
          <span>{tool.description}</span>
        </span>
        <span className={`status-pill status-${tool.status}`}>
          {statusLabel(tool.status)}
        </span>
        <ChevronRight className="tool-row-arrow" size={18} aria-hidden="true" />
      </Link>
    );
  }

  const content = (
    <>
      <span className="tool-card-top">
        <span className="icon-tile">
          <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className={`status-pill status-${tool.status}`}>
          {statusLabel(tool.status)}
        </span>
      </span>
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
      <span className="tool-card-foot">
        {available ? (
          <>
            Open tool <ArrowRight size={15} aria-hidden="true" />
          </>
        ) : tool.status === "excluded" ? (
          "Not offered"
        ) : (
          "In development"
        )}
      </span>
    </>
  );

  return available ? (
    <Link className={`tool-card tool-card-available tone-${tone}`} href={href}>
      {content}
    </Link>
  ) : (
    <article className={`tool-card tone-${tone}`}>{content}</article>
  );
}
