"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, PhoneCall, MessageSquare } from "lucide-react";
import Link from "next/link";

type FaqItem = {
  question: string;
  answer: string;
  category: string;
};

const faqs: FaqItem[] = [
  {
    category: "Home Collection",
    question: "How does ScopeX home sample collection work?",
    answer:
      "A certified diagnostic phlebotomist visits your home at your selected morning slot. They use 100% sterile, single-use vacutainer collection kits. After collection, samples are immediately barcoded and sealed in a temperature-monitored cold-chain carrier (2°C–8°C) to ensure zero deterioration during transit to our accredited pathology lab."
  },
  {
    category: "Pricing & Savings",
    question: "Are there any hidden fees or extra collection charges?",
    answer:
      "No. At ScopeX, we follow strict real-price transparency with zero artificial discounts or inflated base rates. Doorstep sample collection is completely free for all qualified orders above ₹600 and health packages. You only pay the exact price shown on the platform."
  },
  {
    category: "Reports & Timelines",
    question: "How and when will I receive my diagnostic reports?",
    answer:
      "Verified digital reports are typically ready within 10 to 12 hours of laboratory receipt for routine tests (e.g., CBC, Thyroid, HbA1c, LFT). You will receive an instant notification with a secure link on WhatsApp, SMS, and email. You can also view and download full medical-grade PDF reports directly from your ScopeX patient dashboard."
  },
  {
    category: "Preparation & Fasting",
    question: "Do I need to fast before my blood test?",
    answer:
      "Tests like Fasting Blood Sugar (FBS), Lipid Profile (cholesterol), Liver Function (LFT), and Comprehensive Health Checkups usually require 10 to 12 hours of overnight fasting (water is allowed). Other tests like Thyroid (TSH), HbA1c, or Vitamin D do not require fasting. Our team sends clear preparation guidelines via WhatsApp before your visit."
  },
  {
    category: "Doctor Prescriptions",
    question: "Can I upload a doctor's prescription if I don't know what to book?",
    answer:
      "Yes. Tap 'Upload Prescription' in our quick actions to upload a photo or PDF of your doctor's slip. A ScopeX medical care coordinator will review the prescribed tests, calculate your real prices with transparent bundle savings, and contact you within 15 minutes to confirm your preferred home collection time."
  },
  {
    category: "Quality & Safety",
    question: "How do you ensure test accuracy and specimen safety?",
    answer:
      "All diagnostic specimens are processed in laboratories strictly conforming to NABL quality benchmarks and international pathology standards. Automated barcode scanning eliminates specimen mix-ups, and active cold-chain logistics maintain biomarker integrity from your doorstep to the testing analyzers."
  },
  {
    category: "Booking & Changes",
    question: "Can I reschedule or cancel my appointment?",
    answer:
      "Yes, you can easily reschedule or cancel your home collection slot at any time up to 2 hours before your phlebotomist's scheduled arrival. You can do this via your patient dashboard or by messaging our support helpline on WhatsApp with zero cancellation penalty."
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggleFaq(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section id="faq" className="border-t border-[#EAEAEA] bg-white py-16 md:py-24">
      <div className="section-wrap">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-3.5 py-1 text-xs font-semibold text-[#111111]">
            <HelpCircle className="h-3.5 w-3.5 text-[#FF7900]" />
            <span>Patient Assurance &amp; FAQs</span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#555555] sm:text-base">
            Everything you need to know about ScopeX doorstep blood sample collection, lab safety standards, and verified digital reports.
          </p>
        </div>

        {/* Minimal Accordion Container */}
        <div className="mx-auto mt-8 sm:mt-10 max-w-3xl space-y-2.5 sm:space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                  isOpen
                    ? "border-[#FF6600] bg-white shadow-[0_8px_24px_rgba(255,102,0,0.08)]"
                    : "border-[#EAEAEA] bg-white hover:border-[#D5D5D5]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-xs sm:text-base font-bold text-[#111111]">
                    {faq.question}
                  </span>
                  <div
                    className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${
                      isOpen
                        ? "bg-[#FFF4EC] text-[#FF6600] rotate-180"
                        : "bg-stone-50 text-[#555555]"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[#F2F2F2] px-4 sm:px-5 pb-4 sm:pb-5 pt-3">
                    <p className="text-xs sm:text-sm leading-relaxed text-[#555555]">
                      {faq.answer}
                    </p>
                    <span className="mt-2.5 inline-block rounded-md bg-[#FFF4EC] px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-[#FF6600]">
                      {faq.category}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Support Banner */}
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-[#EAEAEA] bg-white p-5 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-bold text-[#111111]">Have a specific test question?</p>
            <p className="text-xs text-[#555555]">Our clinical advisors are available 10 AM – 6 PM for free guidance.</p>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2.5 sm:mt-0">
            <Link
              href="/health-advisor"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#FF6600] bg-white px-4 py-2 text-xs font-bold text-[#FF6600] transition hover:bg-[#FFF4EC]"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Talk to Advisor</span>
            </Link>
            <Link
              href="https://wa.me/918989273440?text=Hi%20SCOPEX%2C%20I%20have%20a%20question%20about%20blood%20tests"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#20ba5a]"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
