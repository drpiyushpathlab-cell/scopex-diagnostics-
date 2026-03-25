import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingActions } from "@/components/floating-actions";
import { HealthAdvisorPopup } from "@/components/health-advisor-popup";

const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", weight: ["400", "600", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["400", "700", "800"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.scopexdiagnostics.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png"
  },
  title: {
    default: "Book Blood Test at Home | ScopeX Diagnostics India",
    template: "%s | SCOPEX DIAGNOSTICS"
  },
  description:
    "Book blood tests at home with ScopeX Diagnostics. Accurate reports, home sample collection, and preventive health packages. Now live in Lucknow and expanding across India.",
  keywords: [
    "blood test at home",
    "home sample collection india",
    "full body checkup",
    "online blood test booking"
  ],
  robots: {
    index: true,
    follow: true
  },
  alternates: {
    canonical: "/"
  },
  verification: {
    google: "PASTE_VERIFICATION_CODE_HERE"
  },
  openGraph: {
    title: "Book Blood Test at Home | ScopeX Diagnostics India",
    description:
      "Book blood tests at home with ScopeX Diagnostics. Accurate reports, home sample collection, and preventive health packages. Now live in Lucknow and expanding across India.",
    url: siteUrl,
    siteName: "SCOPEX DIAGNOSTICS",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${poppins.variable} ${montserrat.variable} font-[var(--font-poppins)]`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                document.documentElement.classList.add('light');
              })();
            `
          }}
        />
        <SiteHeader />
        <main className="pb-28 md:pb-24">{children}</main>
        <SiteFooter />
        <FloatingActions />
        <HealthAdvisorPopup />
      </body>
    </html>
  );
}
