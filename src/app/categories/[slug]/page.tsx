import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryCard } from "@/components/category-card";
import { CategoryToolList } from "@/components/category-tool-list";
import { categories, getCategory, getToolsForCategory, tools } from "@/lib/tools/registry";
import { categoryPresentation } from "@/lib/tools/ui";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);

  if (!category) return {};

  return {
    title: category.name,
    description: `${category.description} Explore ${category.name.toLowerCase()} online.`,
    alternates: { canonical: `/categories/${category.id}` },
    openGraph: {
      title: `${category.name} | TOOL45`,
      description: `${category.description} Explore tools online.`,
      url: `/categories/${category.id}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const categoryTools = getToolsForCategory(category.id);
  const readyCount = categoryTools.filter((tool) => tool.status === "available").length;
  const { icon: Icon, tone } = categoryPresentation[category.id];
  const otherCategories = categories.filter((entry) => entry.id !== category.id);

  return (
    <main className="page-shell listing-page" id="main-content">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
      />
      <header className={`page-heading page-heading-icon tone-${tone}`}>
        <span className="icon-tile icon-tile-lg">
          <Icon size={30} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div>
          <h1>{category.name}</h1>
          <p>{category.description}</p>
          <p className="heading-meta">
            <strong>{categoryTools.length}</strong> tools ·{" "}
            <strong>{readyCount}</strong> ready to use
          </p>
        </div>
      </header>

      <CategoryToolList tools={categoryTools} />

      <section className="related-categories" aria-labelledby="related-categories-title">
        <h2 id="related-categories-title">Explore other categories</h2>
        <div className="category-grid category-grid-compact">
          {otherCategories.slice(0, 5).map((entry) => (
            <CategoryCard
              category={entry}
              key={entry.id}
              toolCount={tools.filter((tool) => tool.categoryId === entry.id).length}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
