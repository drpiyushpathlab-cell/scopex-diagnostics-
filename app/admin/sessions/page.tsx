import type { Metadata } from "next";
import { AdminOperationsPage } from "@/components/admin-operations-page";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = {
  title: "Active Users and Login History",
  description: "Review recent logins, user sessions, IP addresses, and device/browser activity."
};

export default function Page() {
  return (
    <section className="section-wrap py-14">
      <AdminSessionGuard>
        <AdminOperationsPage mode="sessions" title="Active Users and Login History" subtitle="Review recent logins, user sessions, IP addresses, and device/browser activity." />
      </AdminSessionGuard>
    </section>
  );
}
