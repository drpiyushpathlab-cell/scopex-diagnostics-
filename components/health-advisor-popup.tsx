"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { submitViaFormSubmit } from "@/lib/formsubmit";

type SubmitState = "idle" | "loading" | "success" | "error";
const mobileRegex = /^[6-9]\d{9}$/;

export function HealthAdvisorPopup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [mobileNumber, setMobileNumber] = useState("");
  const [purpose, setPurpose] = useState<"before_test" | "after_test">("before_test");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const withinHours = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 10 && hour < 18;
  }, []);

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
      await submitViaFormSubmit({
        leadType: "health_advisor",
        name,
        age: Number(age),
        appointmentDate,
        gender,
        mobileNumber: sanitizedMobile,
        purpose
      });
      setStatus("success");
      setName("");
      setAge("");
      setAppointmentDate("");
      setGender("male");
      setMobileNumber("");
      setMessage("Advisor request submitted.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Submission failed.");
    }
  }

  useEffect(() => {
    const openModal = () => setOpen(true);
    window.addEventListener("scopex:open-advisor", openModal as EventListener);
    return () => window.removeEventListener("scopex:open-advisor", openModal as EventListener);
  }, []);

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--surface)] p-6 text-[var(--text)]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-scopex-orange">10 AM - 6 PM</p>
                <h3 className="text-xl font-bold">Talk to a Health Advisor</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">SCOPEX Test Expert - Smart guidance for the right test.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-black/20 px-2 py-1 text-sm font-semibold text-black dark:border-white/20 dark:text-white"
              >
                Close
              </button>
            </div>
            {!withinHours ? (
              <p className="mb-4 rounded-lg border border-scopex-orange/40 bg-scopex-orange/10 px-3 py-2 text-xs">
                Advisor booking is available between 10:00 AM and 6:00 PM IST.
              </p>
            ) : null}
            <form className="space-y-4" onSubmit={onSubmit}>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm"
                />
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "male" | "female" | "other")}
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm"
                >
                  <option value="male" className="bg-[var(--bg)]">
                    Male
                  </option>
                  <option value="female" className="bg-[var(--bg)]">
                    Female
                  </option>
                  <option value="other" className="bg-[var(--bg)]">
                    Other
                  </option>
                </select>
              </div>
              <input
                required
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm"
              />
              <input
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Mobile Number"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPurpose("before_test")}
                  className={`rounded-lg border px-3 py-2 uppercase tracking-[0.08em] ${purpose === "before_test" ? "border-scopex-orange bg-scopex-orange text-white" : "border-white/20"}`}
                >
                  Before Test
                </button>
                <button
                  type="button"
                  onClick={() => setPurpose("after_test")}
                  className={`rounded-lg border px-3 py-2 uppercase tracking-[0.08em] ${purpose === "after_test" ? "border-scopex-orange bg-scopex-orange text-white" : "border-white/20"}`}
                >
                  After Test
                </button>
              </div>
              <button type="submit" disabled={status === "loading"} className="cta-btn w-full disabled:opacity-60">
                {status === "loading" ? "SUBMITTING..." : "REQUEST CALLBACK"}
              </button>
            </form>
            {message ? (
              <p className={`mt-3 text-xs ${status === "success" ? "text-green-600" : "text-red-600"}`}>{message}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
