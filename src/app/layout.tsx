import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

import "./tools.css";
import "./design.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: `${siteName} – Free online tools`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  icons: {
    icon: "/Glossy%20TOOL45%20Gradient%20Logo.png",
    apple: "/Glossy%20TOOL45%20Gradient%20Logo.png",
  },
  openGraph: {
    type: "website",
    siteName,
    title: `${siteName} – Free online tools`,
    description: siteDescription,
    url: "/",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
