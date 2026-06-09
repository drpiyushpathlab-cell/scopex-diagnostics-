import type { Metadata } from "next";
import { AdminOperationsPage } from "@/components/admin-operations-page";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export const metadata: Metadata = {
  title: "Booking Management",
  description: "Review, edit, print, assign, delete, and update status for all home collection bookings."
};

export default function Page() {
  return (
    <section className="section-wrap py-14">
      <AdminSessionGuard>
        <AdminOperationsPage mode="bookings" title="Booking Management" subtitle="Review, edit, print, assign, delete, and update status for all home collection bookings." />
      </AdminSessionGuard>
    </section>
  );
}
