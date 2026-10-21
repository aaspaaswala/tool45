import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  FileCheck2,
  Fingerprint,
  Layers3,
  MousePointer2,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";

import { categoryPresentation } from "@/lib/tools/ui";
import { categories, tools } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "About TOOL45",
  description:
    "Discover the thinking behind TOOL45: practical online tools, clear workflows, and thoughtful handling of your files and data.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    icon: MousePointer2,
    title: "One task at a time",
    description:
      "Each tool is designed around a specific job, so you can get to the useful part without wading through a complicated interface.",
    tone: "blue",
  },
  {
    icon: Fingerprint,
    title: "Privacy with clarity",
    description:
      "Processing depends on the tool. Look for its privacy note before you begin to understand how your text or files are handled.",
    tone: "violet",
  },
  {
    icon: FileCheck2,
    title: "Honest about limits",
    description:
      "Tools should explain what they do, what they do not do, and any important limitations before you rely on the result.",
    tone: "teal",
  },
];

const steps = [
  {
    number: "01",
    title: "Find the right tool",
    description:
      "Search by the task you have in mind, or browse a category to see what is available.",
    icon: Layers3,
  },
  {
    number: "02",
    title: "Add your input",
    description:
      "Enter text, choose a file, or provide the details the selected tool asks for.",
    icon: MousePointer2,
  },
  {
    number: "03",
    title: "Review and use",
    description:
      "Check the result, adjust the options if needed, and copy or download when the tool supports it.",
    icon: Check,
  },
];

const questions = [
  {
    question: "What is TOOL45?",
    answer:
      "TOOL45 is a collection of small online utilities for common image, document, writing, developer, study, and everyday tasks. The catalog is growing over time.",
  },
  {
    question: "Are the tools free to use?",
    answer:
      "TOOL45 is presented as a free collection, and you do not need to create an account to get started. Individual tool pages describe any requirements or limitations that apply.",
  },
  {
    question: "Are my files uploaded?",
    answer:
      "It depends on the tool. Some tasks can run in your browser, while others may work differently. Please read the privacy note on the specific tool page before adding sensitive content.",
  },
  {
    question: "How do I know whether a tool is ready?",
    answer:
      "Each tool page explains its workflow and available options. TOOL45 aims to make a tool available only when its main workflow is implemented and checked; always review important output before relying on it.",
  },
  {
    question: "Can I suggest a tool or report a problem?",
    answer:
      "A public support email or contact form has not been configured yet. The Contact page will be updated when a working contact channel is available.",
    href: "/contact",
  },
];

export default function AboutPage() {
  return (
    <main className="about-page" id="main-content">
      <section className="about-hero">
        <div className="about-hero-inner page-shell">
          <div className="about-hero-copy">
            <p className="about-eyebrow">
              <span className="about-eyebrow-mark">
                <Sparkles size={14} aria-hidden="true" />
              </span>
              A little about TOOL45
            </p>
            <h1>
              Less busywork.
              <br />
              <span>More done.</span>
            </h1>
            <p className="about-hero-intro">
              TOOL45 brings practical online tools together in one place—so
              everyday tasks feel a little simpler, quicker, and easier to
              understand.
            </p>
            <div className="about-hero-actions">
              <Link className="button-primary about-primary-link" href="/categories">
                Explore all tools
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <a className="about-text-link" href="#our-approach">
                Get to know us
                <ArrowDown size={15} aria-hidden="true" />
              </a>
            </div>
            <div className="about-hero-proof" aria-label="TOOL45 at a glance">
              <div>
                <strong>{tools.length}</strong>
                <span>practical tools</span>
              </div>
              <span className="about-proof-divider" aria-hidden="true" />
              <div>
                <strong>{categories.length}</strong>
                <span>ways to explore</span>
              </div>
              <span className="about-proof-divider" aria-hidden="true" />
              <div>
                <strong>One</strong>
                <span>simple place to start</span>
              </div>
            </div>
          </div>

          <div className="about-hero-art" aria-label="A preview of TOOL45 tools">
            <div className="about-art-orbit about-art-orbit-one" />
            <div className="about-art-orbit about-art-orbit-two" />
            <div className="about-art-spark about-art-spark-one">
              <Sparkles size={18} aria-hidden="true" />
            </div>
            <div className="about-art-spark about-art-spark-two">
              <Zap size={17} aria-hidden="true" />
            </div>
            <div className="about-art-window">
              <div className="about-art-window-top">
                <span className="about-art-logo" aria-hidden="true">
                  45
                </span>
                <span>toolbox</span>
                <span className="about-art-window-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="about-art-greeting">
                <span>YOUR EVERYDAY TOOLKIT</span>
                <strong>What can we help with?</strong>
              </div>
              <div className="about-art-search">
                <span className="about-art-search-icon" aria-hidden="true" />
                Search for a tool
              </div>
              <div className="about-art-cards">
                <Link href="/tools/image-resizer" className="about-art-tool">
                  <span className="about-art-tool-icon about-art-tool-image">
                    <WandSparkles size={17} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>Image resizer</strong>
                    <small>Make it fit just right</small>
                  </span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
                <Link href="/tools/word-counter" className="about-art-tool">
                  <span className="about-art-tool-icon about-art-tool-text">
                    <Code2 size={17} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>Word counter</strong>
                    <small>Know your word count</small>
                  </span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
              <div className="about-art-caption">
                <span />
                A clearer way to get things done
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="about-jump-nav page-shell" aria-label="On this page">
        <span>On this page</span>
        <a href="#our-approach">Our approach</a>
        <a href="#how-it-works">How it works</a>
        <a href="#explore-categories">Explore categories</a>
        <a href="#questions">Questions</a>
      </nav>

      <section className="about-approach section" id="our-approach">
        <div className="page-shell">
          <div className="about-section-heading">
            <div>
              <p className="eyebrow">The idea behind it</p>
              <h2>Useful tools should feel easy.</h2>
            </div>
            <p>
              The little tasks add up. Changing a file, checking a number, or
              fixing a piece of text should not mean hunting through a dozen
              tabs or learning a complicated app.
            </p>
          </div>
          <div className="about-approach-grid">
            <article className="about-manifesto">
              <div className="about-manifesto-icon">
                <Sparkles size={20} aria-hidden="true" />
              </div>
              <p className="about-manifesto-label">WHY TOOL45 EXISTS</p>
              <h3>A helpful shortcut for the small stuff.</h3>
              <p>
                TOOL45 is being built as a growing collection of focused
                utilities for real, everyday jobs. Find what you need, get a
                clear path through it, and get back to what matters.
              </p>
              <Link className="about-inline-link" href="/categories">
                Find your next tool <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <div className="about-manifesto-decoration" aria-hidden="true">
                <span>45</span>
              </div>
            </article>
            <div className="about-principles">
              {principles.map(({ icon: Icon, title, description, tone }) => (
                <article className="about-principle" key={title}>
                  <span className={`about-principle-icon tone-${tone}`}>
                    <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-workflow section section-muted" id="how-it-works">
        <div className="page-shell">
          <div className="about-section-heading about-section-heading-centered">
            <div>
              <p className="eyebrow">A straightforward flow</p>
              <h2>From “I need to…” to done.</h2>
            </div>
            <p>
              No big learning curve. Pick a task and follow the steps the tool
              gives you.
            </p>
          </div>
          <div className="about-steps">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <article className="about-step" key={number}>
                <div className="about-step-top">
                  <span className="about-step-icon">
                    <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="about-step-number">{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-categories section" id="explore-categories">
        <div className="page-shell">
          <div className="about-section-heading">
            <div>
              <p className="eyebrow">A growing collection</p>
              <h2>One place, lots of little helpers.</h2>
            </div>
            <Link className="about-inline-link about-category-all" href="/categories">
              See all {tools.length} tools
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="about-category-grid">
            {categories.map((category) => {
              const { icon: Icon, tone, shortName } =
                categoryPresentation[category.id];
              const count = tools.filter(
                (tool) => tool.categoryId === category.id,
              ).length;

              return (
                <Link
                  className="about-category-card"
                  href={`/categories/${category.id}`}
                  key={category.id}
                >
                  <span className={`about-category-icon tone-${tone}`}>
                    <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="about-category-copy">
                    <strong>{shortName}</strong>
                    <small>{count} tools</small>
                  </span>
                  <ArrowUpRight
                    className="about-category-arrow"
                    size={16}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-faq section section-muted" id="questions">
        <div className="page-shell about-faq-layout">
          <div className="about-faq-heading">
            <span className="about-faq-icon">
              <CircleHelp size={22} aria-hidden="true" />
            </span>
            <p className="eyebrow">Good to know</p>
            <h2>Questions, answered.</h2>
            <p>
              A little more detail about using TOOL45 and what to expect.
            </p>
            <Link className="about-inline-link" href="/contact">
              Visit contact page <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="about-faq-list">
            {questions.map(({ question, answer, href }) => (
              <details className="about-faq-item" key={question}>
                <summary>
                  <span>{question}</span>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <p>
                  {answer}
                  {href && (
                    <>
                      {" "}
                      <Link href={href}>See the Contact page</Link>.
                    </>
                  )}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="about-cta-section">
        <div className="page-shell">
          <div className="about-cta-card">
            <span className="about-cta-icon">
              <WandSparkles size={20} aria-hidden="true" />
            </span>
            <p className="about-cta-kicker">Your next small task, made simpler</p>
            <h2>Ready to find your tool?</h2>
            <p className="about-cta-copy">
              Browse the collection and find a practical helper for what
              you&apos;re working on.
            </p>
            <Link className="about-cta-button" href="/categories">
              Browse all tools
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
