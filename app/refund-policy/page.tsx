import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | ScopeX Diagnostics",
  description: "Read the ScopeX Diagnostics refund and cancellation policy for home sample collection bookings, missed slots, duplicate payments, and report-related cases."
};

const policies = [
  {
    title: "Cancellation Before Collection",
    body:
      "You may request cancellation before the sample collection team is assigned or dispatched. Eligible refunds are processed to the original payment method after verification."
  },
  {
    title: "Cancellation After Dispatch",
    body:
      "If the phlebotomist has already been assigned or is on the way, cancellation may be subject to operational charges or may not be eligible for full refund."
  },
  {
    title: "No Refund After Sample Collection",
    body:
      "Once the sample has been collected, refunds are generally not available because lab processing and reporting workflows begin immediately."
  },
  {
    title: "Duplicate or Failed Payments",
    body:
      "If a duplicate payment or payment gateway error is confirmed, the excess amount will be refunded after reconciliation with the payment provider."
  },
  {
    title: "Rescheduling",
    body:
      "Customers may request slot rescheduling based on availability. Rescheduling is recommended when fasting or preparation requirements are not met."
  },
  {
    title: "Refund Timelines",
    body:
      "Approved refunds are usually initiated within 5-7 working days. The final credit timeline depends on the bank, card issuer, UPI provider, or payment gateway."
  },
  {
    title: "How to Request Support",
    body:
      "For cancellations, refunds, or payment concerns, contact ScopeX Diagnostics at support@scopexdiagnostics.in or +91-8989273440 with your booking ID and registered mobile number."
  }
];

export default function RefundPolicyPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap rounded-[32px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-10">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f8f7c]">ScopeX Diagnostics</p>
        <h1 className="mt-3 text-3xl font-black text-[#102a2d] md:text-5xl">Refund &amp; Cancellation Policy</h1>
        <p className="mt-3 text-sm font-semibold text-[#f37021]">Last Updated: June 2026</p>
        <p className="mt-5 max-w-4xl text-sm leading-8 text-[var(--muted)] md:text-base">
          This policy explains how cancellations, rescheduling, failed payments, duplicate payments, and refund requests
          are handled for ScopeX Diagnostics home sample collection services.
        </p>

        <div className="mt-8 grid gap-4">
          {policies.map((section) => (
            <article key={section.title} className="rounded-[24px] border border-[#deece9] bg-[#f7fbfa] p-5">
              <h2 className="text-xl font-black text-[#102a2d]">{section.title}</h2>
              <p className="mt-3 text-sm leading-8 text-[var(--muted)] md:text-base">{section.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
