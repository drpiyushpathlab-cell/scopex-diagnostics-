import type { Metadata } from "next";
import { AdminCustomerCareDesk } from "@/components/admin-customer-care";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = {
  title: "Customer Care & Phlebotomy Dispatch Desk | SCOPEX Diagnostics",
  description: "Unified customer support callbacks, slot confirmation, lead conversion, and phlebotomy collection dispatch."
};

export default function Page() {
  return (
    <section className="section-wrap py-10">
      <AdminSessionGuard>
        <AdminCustomerCareDesk />
      </AdminSessionGuard>
    </section>
  );
}
