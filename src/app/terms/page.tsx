import type { Metadata } from "next";

import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms for using the TOOL45 website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of use"
      intro="These initial terms describe the intended use of this early project."
    >
      <h2>Use of the website</h2>
      <p>
        TOOL45 is being developed as a collection of general-purpose
        utilities. Do not rely on a tool for a high-stakes decision unless its
        instructions and limitations clearly support that use.
      </p>
      <h2>Availability and accuracy</h2>
      <p>
        The website and its tools are provided as they become available.
        Calculations and conversions may depend on the inputs and assumptions
        shown by the individual tool. Check important results independently.
      </p>
      <p className="policy-note">
        These draft terms should be reviewed for the actual jurisdiction and
        service before public launch.
      </p>
    </InfoPage>
  );
}
