import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | ScopeX Diagnostics",
  description:
    "Read the ScopeX Diagnostics refund and cancellation policy for cancellations, rescheduling, duplicate payments, report delays, and billing support."
};

const sections = [
  {
    title: "1. Cancellation Before Sample Collection",
    body:
      "Customers may cancel a booking before the scheduled sample collection or laboratory visit. Eligible refunds, if any, will be processed after verification and credited to the original payment method within 7-10 business days."
  },
  {
    title: "2. Cancellation After Sample Collection",
    body:
      "Once a biological sample has been collected, processing, transportation, or testing may begin immediately. Therefore, no refund shall be provided after sample collection, except in cases where ScopeX Diagnostics determines that the service could not be delivered due to its own operational error."
  },
  {
    title: "3. Rescheduling of Appointments",
    body:
      "Customers may request rescheduling of appointments subject to availability of slots, service coverage, and operational feasibility. ScopeX Diagnostics reserves the right to approve or decline rescheduling requests based on operational requirements."
  },
  {
    title: "4. Failed or Incomplete Sample Collection",
    body:
      "If sample collection cannot be completed due to reasons attributable to ScopeX Diagnostics, including staff unavailability or operational issues, the customer may choose either a rescheduled appointment or a full refund of the amount paid."
  },
  {
    title: "5. Customer Unavailability",
    body:
      "If the customer or patient is unavailable at the scheduled collection time, provides incorrect contact details, refuses sample collection, or fails to comply with collection requirements, ScopeX Diagnostics may treat the appointment as completed and no refund may be issued."
  },
  {
    title: "6. Duplicate or Excess Payments",
    body:
      "Any duplicate, excess, or erroneous payment made by a customer will be refunded after verification. Refunds will be processed to the original payment method used for the transaction."
  },
  {
    title: "7. Report Delays",
    body:
      "While ScopeX Diagnostics endeavors to deliver reports within the estimated timelines, testing requirements, quality control procedures, technical issues, public holidays, force majeure events, or unforeseen circumstances may result in delays. Such delays shall not automatically qualify for a refund."
  },
  {
    title: "8. Promotional Offers and Packages",
    body:
      "Payments made for promotional packages, discounted health checkups, memberships, subscriptions, or special offers may be non-refundable unless specifically stated otherwise in the offer terms."
  },
  {
    title: "9. Refund Processing Time",
    body:
      "Approved refunds are generally processed within 7-10 business days. Actual credit timelines may vary depending on the customer's bank, payment gateway, card issuer, or financial institution."
  },
  {
    title: "10. Right to Refuse Refund",
    body:
      "ScopeX Diagnostics reserves the right to refuse any refund request where services have already been rendered, sample collection has been completed, fraudulent activity is suspected, or the request violates applicable laws or company policies."
  },
  {
    title: "11. Changes to This Policy",
    body:
      "ScopeX Diagnostics reserves the right to modify, amend, or update this Refund & Cancellation Policy at any time without prior notice. Updated versions will be published on the official website."
  }
];

export default function RefundPolicyPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap rounded-[32px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-10">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f8f7c]">ScopeX Diagnostics</p>
        <h1 className="mt-3 text-3xl font-black text-[#102a2d] md:text-5xl">Refund &amp; Cancellation Policy</h1>
        <p className="mt-3 text-sm font-semibold text-[#f37021]">Last Updated: June 2026</p>
        <p className="mt-5 max-w-5xl text-sm leading-8 text-[var(--muted)] md:text-base">
          At ScopeX Diagnostics, we strive to provide high-quality diagnostic services and a seamless customer
          experience. This Refund &amp; Cancellation Policy outlines the terms governing cancellations, refunds, and
          rescheduling of diagnostic services booked through our website, mobile platform, call center, or authorized
          representatives.
        </p>

        <div className="mt-8 grid gap-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[24px] border border-[#deece9] bg-[#f7fbfa] p-5">
              <h2 className="text-lg font-black text-[#102a2d] md:text-xl">{section.title}</h2>
              <p className="mt-3 text-sm leading-8 text-[var(--muted)] md:text-base">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[24px] border border-[#deece9] bg-[#fff8f3] p-5">
          <h2 className="text-xl font-black text-[#102a2d]">Contact Us</h2>
          <p className="mt-3 text-sm leading-8 text-[var(--muted)] md:text-base">
            For refund, cancellation, or billing-related queries, contact ScopeX Diagnostics.
          </p>
          <div className="mt-4 grid gap-2 text-sm font-semibold text-[#102a2d] md:text-base">
            <p>ScopeX Diagnostics</p>
            <p>
              Email:{" "}
              <a className="text-[#0f8f7c] underline-offset-4 hover:underline" href="mailto:scopexdiagnostic@gmail.com">
                scopexdiagnostic@gmail.com
              </a>
            </p>
            <p>
              Website:{" "}
              <a
                className="text-[#0f8f7c] underline-offset-4 hover:underline"
                href="https://www.scopexdiagnostics.in"
                target="_blank"
                rel="noreferrer"
              >
                https://www.scopexdiagnostics.in
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
