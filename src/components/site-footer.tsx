import Link from "next/link";
import Image from "next/image";

import { siteName } from "@/lib/site";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/categories", label: "All Tools" },
      { href: "/categories/image", label: "Image Tools" },
      { href: "/categories/text", label: "Text Tools" },
      { href: "/categories/developer", label: "Developer Tools" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link className="brand" href="/" aria-label={`${siteName} home`}>
            <Image
              alt="TOOL45"
              className="brand-logo"
              height={724}
              src="/Glossy%20TOOL45%20Gradient%20Logo.png"
              width={2172}
            />
          </Link>
          <p>
            Free, fast and privacy-focused online tools for images, text,
            documents and everyday tasks.
          </p>
        </div>
        {columns.map((column) => (
          <nav aria-label={column.title} className="footer-column" key={column.title}>
            <h2>{column.title}</h2>
            {column.links.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
        <p className="copyright">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
