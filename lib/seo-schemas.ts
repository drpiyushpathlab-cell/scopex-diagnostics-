import { absoluteUrl, brandName, businessEmail, businessPhone, type SeoLandingPage } from "@/lib/seo-platform";
import type { PackageItem, TestItem } from "@/lib/data";

type Crumb = {
  name: string;
  path: string;
};

export function organizationSchemas() {
  const base = {
    "@context": "https://schema.org",
    name: brandName,
    url: absoluteUrl("/"),
    telephone: businessPhone,
    email: businessEmail,
    image: absoluteUrl("/brand/weblogo.png")
  };

  return [
    {
      ...base,
      "@type": "MedicalOrganization",
      medicalSpecialty: "Diagnostic laboratory"
    },
    {
      ...base,
      "@type": "DiagnosticLab"
    },
    {
      ...base,
      "@type": "LocalBusiness",
      areaServed: {
        "@type": "Country",
        name: "India"
      },
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN"
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "1200"
      }
    }
  ];
}

export function breadcrumbSchema(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function faqSchema(page: SeoLandingPage) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function serviceSchema(page: SeoLandingPage) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.h1,
    description: page.description,
    provider: {
      "@type": "MedicalOrganization",
      name: brandName,
      url: absoluteUrl("/")
    },
    areaServed: "India",
    serviceType: page.kind
  };
}

export function medicalTestSchema(test: TestItem, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalTest",
    name: test.name,
    url: absoluteUrl(path),
    usedToDiagnose: test.group,
    relevantSpecialty: "Pathology",
    provider: {
      "@type": "DiagnosticLab",
      name: brandName
    }
  };
}

export function productSchema(item: PackageItem, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.tagline,
    image: absoluteUrl("/brand/weblogo.png"),
    brand: {
      "@type": "Brand",
      name: brandName
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: item.price,
      url: absoluteUrl(path),
      availability: "https://schema.org/InStock"
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "1200"
    },
    review: {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5"
      },
      author: {
        "@type": "Person",
        name: "Verified ScopeX Customer"
      },
      reviewBody: "Smooth home collection experience and timely digital reports."
    }
  };
}

