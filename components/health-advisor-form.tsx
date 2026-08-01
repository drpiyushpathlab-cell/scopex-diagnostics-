"use client";

import { FormEvent, useState } from "react";
import { submitLead } from "@/lib/lead-submit";

type SubmitState = "idle" | "loading" | "success" | "error";
type AdvisorPurpose = "before_test" | "after_test";
type AdvisorGender = "male" | "female" | "other";

const mobileRegex = /^[6-9]\d{9}$/;

type HealthAdvisorFormProps = {
  surfaceClassName?: string;
  showPurposeToggle?: boolean;
};

export function HealthAdvisorForm({
  surfaceClassName = "rounded-[28px] border border-[#f1dfce] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-6",
  showPurposeToggle = true
}: HealthAdvisorFormProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [gender, setGender] = useState<AdvisorGender>("male");
  const [mobileNumber, setMobileNumber] = useState("");
  const [purpose, setPurpose] = useState<AdvisorPurpose>("before_test");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const sanitizedMobile = mobileNumber.replace(/\D/g, "");
    if (!mobileRegex.test(sanitizedMobile)) {
      setStatus("error");
      setMessage("Enter a valid 10-digit mobile number.");
      return;
    }

    try {
      await submitLead({
        leadType: "health_advisor",
        name,
        age: Number(age),
        appointmentDate,
        gender,
        mobileNumber: sanitizedMobile,
        purpose
      }, "/api/health-advisor");
      setStatus("success");
      setName("");
      setAge("");
      setAppointmentDate("");
      setGender("male");
      setMobileNumber("");
      setPurpose("before_test");
      setMessage("Your callback request has been submitted. Our advisor will reach out shortly.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Submission failed.");
    }
  }

  return (
    <div className={surfaceClassName}>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F7931E]">Talk to a Health Advisor</p>
        <h3 className="mt-2 text-2xl font-bold text-[#0D0D0D] md:text-3xl">Get expert guidance in just 2 minutes</h3>
        <p className="mt-2 text-sm leading-7 text-[#5f6868]">
          Confused about which test to choose? Share a few details and our team will guide you with the right next
          step.
        </p>
      </div>

      <div className="mb-5 grid gap-2.5">
        {[
          "Free expert guidance",
          "No unnecessary tests recommended",
          "Quick response within minutes"
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-2xl border border-[#e3efed] bg-[#FFF8F2] px-3 py-2.5 text-sm font-medium text-[#5f6868]"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#eaf8f5] text-[#F7931E]">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m4.5 10 3.5 3.5L15.5 6" />
              </svg>
            </span>
            {item}
          </div>
        ))}
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className="w-full rounded-2xl border border-[#f1dfce] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#F7931E]"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Age"
            className="w-full rounded-2xl border border-[#f1dfce] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#F7931E]"
          />
          <select
            required
            value={gender}
            onChange={(e) => setGender(e.target.value as AdvisorGender)}
            className="w-full rounded-2xl border border-[#f1dfce] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#F7931E]"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-2xl border border-[#f1dfce] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#F7931E]"
          />
          <input
            required
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Mobile Number"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            className="w-full rounded-2xl border border-[#f1dfce] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#F7931E]"
          />
        </div>

        {showPurposeToggle ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPurpose("before_test")}
              className={`rounded-2xl border px-3 py-3 font-semibold uppercase tracking-[0.08em] transition ${
                purpose === "before_test"
                  ? "border-[#F7931E] bg-[#F7931E] text-white"
                  : "border-[#f1dfce] bg-white text-[#5f6868]"
              }`}
            >
              Before Test
            </button>
            <button
              type="button"
              onClick={() => setPurpose("after_test")}
              className={`rounded-2xl border px-3 py-3 font-semibold uppercase tracking-[0.08em] transition ${
                purpose === "after_test"
                  ? "border-[#F7931E] bg-[#F7931E] text-white"
                  : "border-[#f1dfce] bg-white text-[#5f6868]"
              }`}
            >
              After Test
            </button>
          </div>
        ) : null}

        <button type="submit" disabled={status === "loading"} className="cta-btn w-full disabled:opacity-60">
          {status === "loading" ? "Submitting..." : "Request Callback"}
        </button>
      </form>

      {message ? (
        <p className={`mt-3 text-sm ${status === "success" ? "text-[#F7931E]" : "text-red-600"}`}>{message}</p>
      ) : null}

      <p className="mt-4 text-xs leading-6 text-[#7b8f91]">
        This service provides general guidance for diagnostic tests only and does not replace medical consultation,
        diagnosis, or treatment by a qualified doctor.
      </p>
    </div>
  );
}
