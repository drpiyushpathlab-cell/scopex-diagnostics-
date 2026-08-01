import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking-flow";

export const metadata: Metadata = {
  title: "Book Test and Pay Online",
  description: "OTP login, family member booking, offers, and Razorpay checkout for ScopeX Diagnostics."
};

export default function BookHomeCollectionPage() {
  return (
    <section className="section-wrap py-14">
      <div className="mb-6 rounded-full border border-[#ffd8bf] bg-[#fff7f1] px-4 py-3 text-center shadow-[0_10px_24px_rgba(243,112,33,0.08)]">
        <p className="text-sm font-semibold tracking-[0.02em] text-[#0D0D0D] md:text-base">
          Add Family Members &amp; Get <span className="text-[#F7931E]">Extra 10% OFF</span>
        </p>
      </div>
      <BookingFlow />
    </section>
  );
}
