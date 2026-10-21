import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface SectionHeadingProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: { href: string; label: string };
  children?: ReactNode;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  action,
}: SectionHeadingProps) {
  return (
    <div className={`section-heading section-heading-${align}`}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id}>{title}</h2>
        {description && <p className="section-subtitle">{description}</p>}
      </div>
      {action && (
        <Link className="text-link" href={action.href}>
          {action.label} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
