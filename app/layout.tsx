import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingActions } from "@/components/floating-actions";
import { HealthAdvisorPopup } from "@/components/health-advisor-popup";

const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", weight: ["400", "600", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["400", "700", "800"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://scopex-diagnostics.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png"
  },
  title: {
    default: "SCOPEX DIAGNOSTICS | Premium Medical Testing",
    template: "%s | SCOPEX DIAGNOSTICS"
  },
  description:
    "SCOPEX DIAGNOSTICS offers premium health packages, individual lab tests, and home sample collection with fast report delivery.",
  keywords: ["SCOPEX", "Diagnostics", "Home Collection", "Lab Tests", "Health Packages"],
  openGraph: {
    title: "SCOPEX DIAGNOSTICS",
    description: "Premium diagnostic services with doorstep collection and fast reports.",
    url: siteUrl,
    siteName: "SCOPEX DIAGNOSTICS",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${montserrat.variable} font-[var(--font-poppins)]`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                const theme = localStorage.getItem('scopex-theme');
                if (theme === 'light') document.documentElement.classList.add('light');
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
