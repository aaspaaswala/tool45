import Link from "next/link";

import { categoryPresentation } from "@/lib/tools/ui";
import type { ToolCategory } from "@/lib/tools/types";

interface CategoryCardProps {
  category: ToolCategory;
  toolCount: number;
  label?: string;
}

export function CategoryCard({ category, toolCount, label }: CategoryCardProps) {
  const { icon: Icon, tone, shortName } = categoryPresentation[category.id];

  return (
    <Link
      className={`category-card tone-${tone}`}
      href={`/categories/${category.id}`}
      aria-label={`${label ?? shortName}: ${toolCount} tools`}
    >
      <span className="icon-tile">
        <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <strong>{label ?? shortName}</strong>
      <small>{toolCount} tools</small>
    </Link>
  );
}
