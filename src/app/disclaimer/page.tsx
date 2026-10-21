import type { Metadata } from "next";

import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Important limitations of TOOL45 and its tools.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <InfoPage
      title="Disclaimer"
      intro="TOOL45 is an evolving project and its tools are intended for general use."
    >
      <p>
        No tool should be treated as professional, financial, medical, legal,
        or academic advice. Check important outputs with an appropriate
        authoritative source.
      </p>
      <p>
        Tool availability, supported inputs, and results may vary. Each
        finished tool should provide its own instructions and limitations.
        The website does not guarantee search rankings, advertising approval,
        or revenue.
      </p>
    </InfoPage>
  );
}
