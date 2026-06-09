import type { Metadata } from "next";
import { AdminOperationsPage } from "@/components/admin-operations-page";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = {
  title: "Revenue and Payment Reports",
  description: "Review Razorpay payments, payment statuses, collected revenue, and export finance reports."
};

export default function Page() {
  return (
    <section className="section-wrap py-14">
      <AdminSessionGuard>
        <AdminOperationsPage mode="revenue" title="Revenue and Payment Reports" subtitle="Review Razorpay payments, payment statuses, collected revenue, and export finance reports." />
      </AdminSessionGuard>
    </section>
  );
}
