import type { Metadata } from "next";
import { AdminOperationsPage } from "@/components/admin-operations-page";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage patient users, activation status, login history, and admin/staff accounts."
};

export default function Page() {
  return (
    <section className="section-wrap py-14">
      <AdminSessionGuard>
        <AdminOperationsPage mode="users" title="User Management" subtitle="Manage patient users, activation status, login history, and admin/staff accounts." />
      </AdminSessionGuard>
    </section>
  );
}
