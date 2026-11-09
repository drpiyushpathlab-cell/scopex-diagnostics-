import type { Metadata } from "next";
import { AdminCrmDesk } from "@/components/admin-crm-desk";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = {
  title: "CRM Lead Desk | ScopeX Diagnostics",
  description:
    "ScopeX Diagnostics CRM: lead capture, territorial auto-assignment by PIN code and workload, duplicate detection, follow-up reminders, and booking conversions."
};

export default function AdminCrmPage() {
  return (
    <section className="section-wrap py-10 md:py-14">
      <AdminSessionGuard>
        <AdminCrmDesk />
      </AdminSessionGuard>
    </section>
  );
}
