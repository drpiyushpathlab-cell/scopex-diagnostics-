import type { Metadata } from "next";
import { PhlebotomistPortal } from "@/components/phlebotomist-portal";

export const metadata: Metadata = {
  title: "Field Phlebotomy Portal | SCOPEX Diagnostics",
  description: "Assigned home collection jobs, status updates, sample barcodes, and clinical draw timestamps."
};

export default function Page() {
  return (
    <section className="section-wrap py-10">
      <PhlebotomistPortal />
    </section>
  );
}
