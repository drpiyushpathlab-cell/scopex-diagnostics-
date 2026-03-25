import type { Metadata } from "next";
import { BookHomeForm } from "@/components/book-home-form";

export const metadata: Metadata = {
  title: "Book Home Collection",
  description: "Schedule SCOPEX home sample collection in minutes."
};

export default function BookHomeCollectionPage() {
  return (
    <section className="section-wrap py-14">
      <div className="mb-6 rounded-full border border-[#ffd8bf] bg-[#fff7f1] px-4 py-3 text-center shadow-[0_10px_24px_rgba(243,112,33,0.08)]">
        <p className="text-sm font-semibold tracking-[0.02em] text-[#102a2d] md:text-base">
          Add Family Members &amp; Get <span className="text-[#f37021]">Extra 10% OFF</span>
        </p>
      </div>
      <h1 className="text-3xl font-bold">Book Home Collection</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Submit your details and our team will confirm your preferred slot for safe and convenient home sample collection.
      </p>
      <BookHomeForm />
    </section>
  );
}
