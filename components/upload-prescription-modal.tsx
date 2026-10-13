"use client";

import { useState } from "react";
import { X, UploadCloud, FileText, CheckCircle2, ShieldCheck, PhoneCall, AlertCircle } from "lucide-react";
import { submitLead } from "@/lib/lead-submit";

interface UploadPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadPrescriptionModal({ isOpen, onClose }: UploadPrescriptionModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select or upload your prescription file (JPEG, PNG, or PDF).");
      return;
    }

    const cleanMobile = mobile.replace(/[^0-9]/g, "");
    if (cleanMobile.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter the patient's full name.");
      return;
    }

    setSubmitting(true);
    try {
      await submitLead({
        leadType: "home_collection",
        name: name.trim(),
        mobileNumber: cleanMobile.slice(-10),
        city: city.trim() || "Unspecified",
        message: `Prescription file attached: ${file.name} (${Math.round(file.size / 1024)} KB). Notes: ${notes.trim() || "None"}`,
        consent: true
      });

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit prescription. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#E8E2DC] bg-white p-6 shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-[#8A8A8A] transition hover:bg-stone-100 hover:text-[#0D0D0D]"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="mt-4 text-2xl font-extrabold text-[#0D0D0D]">
              Prescription Received!
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5f6868]">
              Thank you, <span className="font-semibold text-[#0D0D0D]">{name}</span>. Our certified diagnostic coordinator will review your prescription and call you within 15 minutes at{" "}
              <span className="font-semibold text-[#0D0D0D]">{mobile}</span> to confirm test items and schedule your preferred morning collection slot.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#FFF8F2] p-3 text-xs text-[#5f6868]">
              <ShieldCheck className="h-4 w-4 text-[#F7931E]" />
              <span>Free doorstep sample collection applies for qualified orders.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFile(null);
                onClose();
              }}
              className="cta-btn mt-6 w-full rounded-xl py-3 text-xs font-bold uppercase tracking-wider"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F7931E]">
              <UploadCloud className="h-4 w-4" />
              <span>Fast Track Booking</span>
            </div>
            <h2 className="mt-1 text-2xl font-extrabold text-[#0D0D0D] tracking-tight">
              Upload Doctor Prescription
            </h2>
            <p className="mt-1.5 text-xs text-[#5f6868]">
              Don&apos;t know which tests to select? Upload your prescription and our diagnostic care team will identify the tests and schedule your home visit.
            </p>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* File Upload Drop Area */}
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] mb-1.5">
                  Prescription Document / Photo *
                </label>
                <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E8E2DC] bg-[#FFFDFB] p-5 text-center cursor-pointer transition hover:border-[#F7931E] hover:bg-[#FFF8F2]">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0D0D0D]">
                      <FileText className="h-5 w-5 text-[#F7931E]" />
                      <span className="truncate max-w-[260px]">{file.name}</span>
                      <span className="text-[#8A8A8A]">({Math.round(file.size / 1024)} KB)</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="h-7 w-7 text-[#F7931E]" />
                      <p className="mt-2 text-xs font-semibold text-[#0D0D0D]">
                        Tap to take a photo or browse file
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#8A8A8A]">
                        Supports JPG, PNG, PDF up to 10MB
                      </p>
                    </>
                  )}
                </label>
              </div>

              {/* Patient Name & Mobile */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full rounded-xl border border-[#E8E2DC] px-3.5 py-2.5 text-xs text-[#0D0D0D] focus:border-[#F7931E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full rounded-xl border border-[#E8E2DC] px-3.5 py-2.5 text-xs text-[#0D0D0D] focus:border-[#F7931E] focus:outline-none"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Delhi NCR, Mumbai, Bengaluru..."
                  className="w-full rounded-xl border border-[#E8E2DC] px-3.5 py-2.5 text-xs text-[#0D0D0D] focus:border-[#F7931E] focus:outline-none"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                  Doctor Notes / Specific Concerns (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Fasting required, urgent report needed"
                  className="w-full rounded-xl border border-[#E8E2DC] px-3.5 py-2.5 text-xs text-[#0D0D0D] focus:border-[#F7931E] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="cta-btn w-full rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {submitting ? "Uploading Prescription..." : "Submit Prescription"}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8A8A8A]">
                <PhoneCall className="h-3 w-3 text-[#F7931E]" />
                <span>Our team will call to confirm test package details and pricing.</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
