import type { Metadata } from "next";

import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "Privacy information for the TOOL45 website.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      title="Privacy policy"
      intro="This page describes the current state of the TOOL45 website."
    >
      <p>
        This early version does not provide file-processing tools, accounts,
        analytics, or advertising. It does not intentionally collect text or
        files entered into tools because no tools are active yet.
      </p>
      <h2>Future tools and services</h2>
      <p>
        The privacy behavior may change when features are added. Before a tool
        processes files or sends information to a service, its page should
        explain what is processed, where processing happens, and what is
        retained.
      </p>
      <h2>Contact</h2>
      <p>
        A public contact channel has not been configured. This policy should be
        updated with the site operator&apos;s contact details before launch.
      </p>
      <p className="policy-note">
        This is project information, not legal advice. Review and update it for
        the actual services, analytics, advertising, and legal requirements
        before deployment.
      </p>
    </InfoPage>
  );
}
