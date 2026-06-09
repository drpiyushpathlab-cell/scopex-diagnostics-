import type { Metadata } from "next";
import { AdminAuditLogs } from "@/components/admin-audit-logs";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = {
  title: "Admin Audit Logs",
  description: "Audit logs and activity tracking for ScopeX Diagnostics."
};

export default function AdminAuditLogsPage() {
  return (
    <section className="section-wrap py-14">
      <AdminSessionGuard>
        <AdminAuditLogs />
      </AdminSessionGuard>
    </section>
  );
}
