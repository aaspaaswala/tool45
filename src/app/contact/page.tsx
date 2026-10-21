import type { Metadata } from "next";

import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact information for the TOOL45 project.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact"
      intro="We want TOOL45 to be useful and clear about its limits."
    >
      <p>
        A public support email or contact form has not been configured yet.
        We will publish a working contact channel here before the platform
        needs user support.
      </p>
    </InfoPage>
  );
}
