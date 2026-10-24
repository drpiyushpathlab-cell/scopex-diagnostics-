"use client";

import { useState } from "react";
import {
  X,
  Headphones,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { submitLead } from "@/lib/lead-submit";

interface HealthAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONCERNS = [
  "Diabetes / Blood Sugar",
  "Thyroid Issues",
  "Fatigue & Weakness",
  "Heart & Cholesterol",
  "Vitamin Deficiency",
  "Full Body Checkup",
  "Liver or Kidney Health",
  "Other Symptoms"
];

const CALLBACK_SLOTS = [
  "As soon as possible",
  "Morning (10:00 AM – 1:00 PM)",
  "Afternoon (1:00 PM – 5:00 PM)",
  "Evening (5:00 PM – 8:00 PM)"
];

export function HealthAdvisorModal({ isOpen, onClose }: HealthAdvisorModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 State: Consultation Purpose & Concern
  const [purpose, setPurpose] = useState<"before_test" | "after_test">("before_test");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(["Full Body Checkup"]);

  // Step 2 State: Patient Details
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [city, setCity] = useState("");

  // Step 3 State: Contact & Time
  const [mobileNumber, setMobileNumber] = useState("");
  const [preferredSlot, setPreferredSlot] = useState(CALLBACK_SLOTS[0]);
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function toggleConcern(concern: string) {
    setSelectedConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
  }

  function handleNextStep() {
    setError("");
    if (step === 1) {
      if (selectedConcerns.length === 0) {
        setError("Please select at least one health topic or symptom.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!name.trim()) {
        setError("Please enter the patient's name.");
        return;
      }
      if (!age || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120) {
        setError("Please enter a valid age.");
        return;
      }
      setStep(3);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanMobile = mobileNumber.replace(/\D/g, "");
    if (cleanMobile.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSubmitting(true);
    try {
      await submitLead(
        {
          leadType: "health_advisor",
          name: name.trim(),
          age: Number(age),
          appointmentDate: new Date().toISOString().split("T")[0],
          gender,
          mobileNumber: cleanMobile.slice(-10),
          city: city.trim() || "Unspecified",
          purpose,
          preferredTime: preferredSlot,
          message: `Concerns: ${selectedConcerns.join(", ")}. Preferred slot: ${preferredSlot}. Notes: ${message.trim() || "None"}`,
          consent: true
        },
        "/api/health-advisor"
      );

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit advisor request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setStep(1);
    setSubmitted(false);
    setName("");
    setAge("");
    setMobileNumber("");
    setMessage("");
    setError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#E8E2DC] bg-white p-6 shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleReset}
          className="absolute right-5 top-5 rounded-full p-2 text-[#8A8A8A] transition hover:bg-stone-100 hover:text-[#0D0D0D]"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          /* Confirmation Screen */
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="mt-4 text-2xl font-extrabold text-[#0D0D0D]">
              Advisor Callback Scheduled!
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5f6868]">
              Thank you, <span className="font-semibold text-[#0D0D0D]">{name}</span>. A ScopeX Certified Health Advisor will call you at{" "}
              <span className="font-semibold text-[#0D0D0D]">{mobileNumber}</span> ({preferredSlot.toLowerCase()}) to guide you on the right tests and explain any fasting or preparation guidelines.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#FFF8F2] p-3 text-xs text-[#5f6868]">
              <ShieldCheck className="h-4 w-4 text-[#FF6B00]" />
              <span>100% Free Consultation · No Unnecessary Tests Pushed</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="cta-btn mt-6 w-full rounded-xl py-3 text-xs font-bold uppercase tracking-wider"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            {/* Top Indicator & Step Counter */}
            <div className="flex items-center justify-between border-b border-[#f1dfce] pb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
                <Headphones className="h-4 w-4" />
                <span>Talk to a Health Advisor</span>
              </div>
              <span className="rounded-full bg-[#FFF8F2] border border-[#f1dfce] px-3 py-1 text-xs font-bold text-[#FF6B00]">
                Step {step} of 3
              </span>
            </div>

            {/* Visual Step Progress Bar */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className={`h-1.5 rounded-full transition-colors ${step >= 1 ? "bg-[#FF6B00]" : "bg-stone-200"}`} />
              <div className={`h-1.5 rounded-full transition-colors ${step >= 2 ? "bg-[#FF6B00]" : "bg-stone-200"}`} />
              <div className={`h-1.5 rounded-full transition-colors ${step >= 3 ? "bg-[#FF6B00]" : "bg-stone-200"}`} />
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Consultation Purpose & Concern */}
            {step === 1 && (
              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-[#0D0D0D]">What do you need help with?</h3>
                  <p className="mt-1 text-xs text-[#5f6868]">
                    Choose the type of guidance you need today.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPurpose("before_test")}
                    className={`rounded-2xl border p-3 text-left transition ${
                      purpose === "before_test"
                        ? "border-[#FF6B00] bg-[#FFF8F2] shadow-xs"
                        : "border-[#E8E2DC] bg-white hover:border-[#FF6B00]/50"
                    }`}
                  >
                    <p className="text-xs font-bold text-[#0D0D0D]">Help Choosing Tests</p>
                    <p className="mt-1 text-[11px] text-[#5f6868]">Before booking blood tests</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurpose("after_test")}
                    className={`rounded-2xl border p-3 text-left transition ${
                      purpose === "after_test"
                        ? "border-[#FF6B00] bg-[#FFF8F2] shadow-xs"
                        : "border-[#E8E2DC] bg-white hover:border-[#FF6B00]/50"
                    }`}
                  >
                    <p className="text-xs font-bold text-[#0D0D0D]">Understand My Report</p>
                    <p className="mt-1 text-[11px] text-[#5f6868]">I already have test results</p>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D] mb-2">
                    Select Your Health Focus Area(s):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CONCERNS.map((c) => {
                      const selected = selectedConcerns.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleConcern(c)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                            selected
                              ? "bg-[#FF6B00] text-white shadow-xs"
                              : "border border-[#E8E2DC] bg-white text-[#404040] hover:border-[#FF6B00]"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="cta-btn w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold tracking-wider uppercase"
                  >
                    <span>Continue to Patient Details</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Patient Details */}
            {step === 2 && (
              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-[#0D0D0D]">Who is this consultation for?</h3>
                  <p className="mt-1 text-xs text-[#5f6868]">
                    Basic profile so our advisor can recommend age-appropriate screening.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ananya Roy"
                    className="w-full rounded-xl border border-[#E8E2DC] px-3.5 py-2.5 text-xs text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                      Age (Years) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 34"
                      className="w-full rounded-xl border border-[#E8E2DC] px-3.5 py-2.5 text-xs text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as "male" | "female" | "other")}
                      className="w-full rounded-xl border border-[#E8E2DC] px-3.5 py-2.5 text-xs text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Delhi NCR, Mumbai, Hyderabad..."
                    className="w-full rounded-xl border border-[#E8E2DC] px-3.5 py-2.5 text-xs text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="secondary-btn flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-wider"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="cta-btn flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-wider"
                  >
                    <span>Next: Callback Slot</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Contact Number & Preferred Slot */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-[#0D0D0D]">Where should we call you?</h3>
                  <p className="mt-1 text-xs text-[#5f6868]">
                    Our clinical health advisor will contact you during your preferred time window.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                    Mobile Number (for Call &amp; WhatsApp) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-[#8A8A8A]">+91</span>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl border border-[#E8E2DC] py-2.5 pl-12 pr-3.5 text-xs text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                    Preferred Callback Window
                  </label>
                  <select
                    value={preferredSlot}
                    onChange={(e) => setPreferredSlot(e.target.value)}
                    className="w-full rounded-xl border border-[#E8E2DC] px-3.5 py-2.5 text-xs text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none bg-white"
                  >
                    {CALLBACK_SLOTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                    Any specific question or symptom detail? (Optional)
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Doctor asked for fasting test, which package has lipid?"
                    className="w-full rounded-xl border border-[#E8E2DC] px-3.5 py-2.5 text-xs text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="secondary-btn flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-wider"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="cta-btn flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {submitting ? "Booking..." : "Request Callback"}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8A8A8A]">
                  <Sparkles className="h-3 w-3 text-[#FF6B00]" />
                  <span>Free service · Average callback time: 10–15 mins</span>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
