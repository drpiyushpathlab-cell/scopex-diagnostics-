import type { Metadata } from "next";
import { AdminSeoHub } from "@/components/admin-seo-hub";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SEO, AEO & GEO Command Center | ScopeX Admin",
  description:
    "ScopeX Diagnostics SEO, AEO & GEO portal: edit titles, meta descriptions, canonical URLs, structured data, clinical review workflows, XML sitemap, redirects, and AI discovery readiness."
};

export default function AdminSeoPage() {
  return (
    <section className="section-wrap py-8 md:py-12">
      <AdminSessionGuard>
        <AdminSeoHub />
      </AdminSessionGuard>
    </section>
  );
}
