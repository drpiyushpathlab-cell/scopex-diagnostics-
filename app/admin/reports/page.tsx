import type { Metadata } from "next";
import { AdminReportManager } from "@/components/admin-report-manager";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = {
  title: "Admin Reports",
  description: "Manage uploaded previous medical reports for ScopeX Diagnostics."
};

export default function AdminReportsPage() {
  return (
    <section className="section-wrap py-14">
      <AdminSessionGuard>
        <AdminReportManager />
      </AdminSessionGuard>
    </section>
  );
}
