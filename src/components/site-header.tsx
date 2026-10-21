"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { siteName } from "@/lib/site";

const links = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "All Tools" },
  { href: "/categories#categories", label: "Categories" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function HeaderSearch({ id, className }: { id: string; className?: string }) {
  return (
    <form
      action="/search"
      className={`header-search ${className ?? ""}`}
      role="search"
    >
      <Search size={16} aria-hidden="true" />
      <label className="visually-hidden" htmlFor={id}>
        Search tools
      </label>
      <input id={id} name="q" placeholder="Search tools…" type="search" />
    </form>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label={`${siteName} home`}>
          <Image
            alt="TOOL45"
            className="brand-logo"
            height={724}
            priority
            src="/Glossy%20TOOL45%20Gradient%20Logo.png"
            width={2172}
          />
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              href={link.href}
              key={link.label}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <HeaderSearch className="header-search-desktop" id="header-search" />
          <ThemeToggle />
          <button
            aria-controls="mobile-menu"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="icon-button menu-button"
            onClick={() => setOpenPath(open ? null : pathname)}
            type="button"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mobile-menu" id="mobile-menu">
          <HeaderSearch id="mobile-search" />
          <nav aria-label="Mobile navigation">
            {links.map((link) => (
              <Link href={link.href} key={link.label}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
