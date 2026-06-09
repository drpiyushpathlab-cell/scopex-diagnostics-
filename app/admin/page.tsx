import type { Metadata } from "next";
import { AdminOverview } from "@/components/admin-overview";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Operations dashboard for ScopeX Diagnostics."
};

export default function AdminPage() {
  return (
    <section className="section-wrap py-14">
      <AdminSessionGuard>
        <AdminOverview />
      </AdminSessionGuard>
    </section>
  );
}
