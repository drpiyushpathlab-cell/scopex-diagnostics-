import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingActions } from "@/components/floating-actions";
import { HealthAdvisorPopup } from "@/components/health-advisor-popup";
import { HomeCollectionPopup } from "@/components/home-collection-popup";

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
    "Book blood tests at home with ScopeX Diagnostics across major Indian cities. Accurate reports, home sample collection, and preventive health packages through a growing Pan India diagnostic network.",
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
      "Book blood tests at home with ScopeX Diagnostics across major Indian cities. Accurate reports, home sample collection, and preventive health packages through a growing Pan India diagnostic network.",
    url: siteUrl,
    siteName: "SCOPEX DIAGNOSTICS",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Book Blood Test at Home | ScopeX Diagnostics India",
    description:
      "Book blood tests at home with ScopeX Diagnostics across major Indian cities. Accurate reports, home sample collection, and preventive health packages through a growing Pan India diagnostic network."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" data-scroll-behavior="smooth" suppressHydrationWarning>
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
        <HomeCollectionPopup />
        <HealthAdvisorPopup />
      </body>
    </html>
  );
}




