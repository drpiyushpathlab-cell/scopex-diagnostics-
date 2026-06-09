import type { Metadata } from "next";
import { AdminOperationsPage } from "@/components/admin-operations-page";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = {
  title: "Completed Bookings",
  description: "Completed bookings and fulfilled home collection orders."
};

export default function Page() {
  return (
    <section className="section-wrap py-14">
      <AdminSessionGuard>
        <AdminOperationsPage mode="bookings" title="Completed Bookings" subtitle="Completed bookings and fulfilled home collection orders." initialStatus="completed" />
      </AdminSessionGuard>
    </section>
  );
}
