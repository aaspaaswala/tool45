import type { MetadataRoute } from "next";

import { categories, tools } from "@/lib/tools/registry";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/categories",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/disclaimer",
  ];
  const lastModified = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: new URL(route, siteUrl).toString(),
      lastModified,
    })),
    ...categories.map((category) => ({
      url: new URL(`/categories/${category.id}`, siteUrl).toString(),
      lastModified,
    })),
    ...tools
      .filter((tool) => tool.status === "available")
      .map((tool) => ({
        url: new URL(`/tools/${tool.id}`, siteUrl).toString(),
        lastModified,
      })),
  ];
}
