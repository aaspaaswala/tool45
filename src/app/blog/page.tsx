import type { Metadata } from "next";

import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides, tips and product updates from TOOL45.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <InfoPage
      eyebrow="TOOL45"
      intro="Guides, tips and product updates are on the way. Check back soon."
      title="Blog"
    />
  );
}
