import type { Metadata } from "next";
import { StructuredData } from "@/components/seo/structured-data";
import { absoluteUrl } from "@/lib/seo-platform";
import { breadcrumbSchema, organizationSchemas } from "@/lib/seo-schemas";
import { GrowthPartnersClient } from "./growth-partners-client";

const growthPartnerFaqs = [
  {
    question: "Who can become a Growth Partner?",
    answer:
      "Insurance companies, TPAs, corporate HR teams, hospitals, clinics, healthcare platforms, diagnostic entrepreneurs, franchise investors, and collection centre owners can enquire for suitable partnership models."
  },
  {
    question: "Is there any joining fee?",
    answer:
      "Joining fee and commercial terms depend on the partnership model, location, service scope, and expected monthly volume. Our business team shares details after reviewing your requirements."
  },
  {
    question: "How long does onboarding take?",
    answer:
      "Onboarding timelines vary by model. Corporate, platform, franchise, integration, and enterprise programs may require requirement analysis, documentation, and training."
  },
  {
    question: "Do you provide dedicated support?",
    answer:
      "Yes. Growth Partners can receive dedicated business support for coordination, operational planning, reporting workflows, and launch assistance based on the agreed partnership scope."
  },
  {
    question: "Can hospitals integrate with ScopeX?",
    answer:
      "Yes. Hospitals and clinics can discuss diagnostic support, referral workflows, sample logistics, report delivery, and technology-enabled coordination with ScopeX."
  },
  {
    question: "Do you support API/LIS integration?",
    answer:
      "Yes. ScopeX can discuss API and LIS integration requirements for healthcare platforms, hospitals, enterprise partners, and digital health workflows."
  },
  {
    question: "Which cities do you currently serve?",
    answer:
      "ScopeX Diagnostics operates through a growing Pan India partner network. Contact our team to confirm service availability in your city."
  },
  {
    question: "How can I schedule a business meeting?",
    answer:
      "Submit the Growth Partner form or use the business contact CTA on this page. Our team will review your details and coordinate the next discussion."
  }
] as const;

const title = "Growth Partners for Diagnostics, Corporate Wellness & Healthcare Platforms | ScopeX Diagnostics";
const description =
  "Partner with ScopeX Diagnostics for insurance medicals, corporate wellness, occupational health, healthcare platform integrations, hospital diagnostic support, and franchise or collection centre opportunities across India.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "ScopeX Diagnostics Growth Partners",
    "diagnostic business partner",
    "corporate health checkup partner",
    "insurance medical checkup partner",
    "occupational health services",
    "pre employment medical",
    "healthcare platform diagnostics",
    "diagnostic franchise India",
    "LIS integration diagnostics",
    "home collection network"
  ],
  alternates: {
    canonical: "/growth-partners"
  },
  openGraph: {
    title,
    description,
    url: absoluteUrl("/growth-partners"),
    siteName: "SCOPEX DIAGNOSTICS",
    type: "website",
    images: [
      {
        url: absoluteUrl("/brand/weblogo.png"),
        width: 1200,
        height: 630,
        alt: "ScopeX Diagnostics Growth Partners"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [absoluteUrl("/brand/weblogo.png")]
  }
};

function growthPartnerFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: growthPartnerFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export default function GrowthPartnersPage() {
  return (
    <>
      <StructuredData
        data={[
          ...organizationSchemas(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Growth Partners", path: "/growth-partners" }
          ]),
          growthPartnerFaqSchema()
        ]}
      />
      <GrowthPartnersClient />
    </>
  );
}

