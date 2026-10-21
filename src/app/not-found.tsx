import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found page-shell" id="main-content">
      <p className="eyebrow">404 · Not found</p>
      <h1>That page isn&apos;t here.</h1>
      <p>It may have moved, or it may not be available yet.</p>
      <Link className="button-primary" href="/">
        Back to TOOL45
      </Link>
    </main>
  );
}
