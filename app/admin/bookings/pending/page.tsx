import type { Metadata } from "next";
import { AdminOperationsPage } from "@/components/admin-operations-page";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = {
  title: "Pending Bookings",
  description: "Bookings waiting for confirmation and operations follow-up."
};

export default function Page() {
  return (
    <section className="section-wrap py-14">
      <AdminSessionGuard>
        <AdminOperationsPage mode="bookings" title="Pending Bookings" subtitle="Bookings waiting for confirmation and operations follow-up." initialStatus="pending_confirmation" />
      </AdminSessionGuard>
    </section>
  );
}
