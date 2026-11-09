import type { Metadata } from "next";
import { AdminPartnerLabs } from "@/components/admin-partner-labs";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = {
  title: "Partner Laboratory Management | SCOPEX Diagnostics",
  description: "Complete Partner Lab ecosystem: Registration, Multi-city locations, Test Master, Rate versioning, Barcode tracking, 10-step lifecycle, and Financial reconciliation."
};

export default function Page() {
  return (
    <section className="section-wrap py-10">
      <AdminSessionGuard>
        <AdminPartnerLabs />
      </AdminSessionGuard>
    </section>
  );
}
