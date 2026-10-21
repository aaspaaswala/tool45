import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryCard } from "@/components/category-card";
import { categories, tools } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "All tools and categories",
  description: "Browse every TOOL45 tool by category.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <main className="page-shell listing-page" id="main-content">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All Tools" }]} />
      <header className="page-heading">
        <h1>All tools & categories</h1>
        <p>
          Browse {tools.length} tools across {categories.length} categories.
          Each card shows whether a tool is ready to use.
        </p>
      </header>
      <div className="category-grid" id="categories">
        {categories.map((category) => (
          <CategoryCard
            category={category}
            key={category.id}
            toolCount={tools.filter((tool) => tool.categoryId === category.id).length}
          />
        ))}
      </div>
    </main>
  );
}
