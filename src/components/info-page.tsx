import type { ReactNode } from "react";

export function InfoPage({
  eyebrow = "TOOL45",
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro: string;
  children?: ReactNode;
}) {
  return (
    <main className="info-page page-shell" id="main-content">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="info-intro">{intro}</p>
      {children && <div className="prose">{children}</div>}
    </main>
  );
}
