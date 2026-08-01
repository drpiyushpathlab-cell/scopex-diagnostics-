"use client";

import { useEffect, useMemo, useState } from "react";
import { HealthAdvisorForm } from "@/components/health-advisor-form";

export function HealthAdvisorPopup() {
  const [open, setOpen] = useState(false);

  const withinHours = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 10 && hour < 18;
  }, []);

  useEffect(() => {
    const openModal = () => setOpen(true);
    window.addEventListener("scopex:open-advisor", openModal as EventListener);
    return () => window.removeEventListener("scopex:open-advisor", openModal as EventListener);
  }, []);

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/55 p-4">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-hidden rounded-[30px] border border-[#f1dfce] bg-white text-[var(--text)] shadow-[0_24px_60px_rgba(16,24,40,0.18)]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#f1dfce] bg-white/95 p-4 backdrop-blur md:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#F7931E]">10 AM - 6 PM</p>
                <h3 className="text-xl font-bold text-[#0D0D0D]">Talk to a Health Advisor</h3>
                <p className="mt-1 text-xs text-[#5f6868]">SCOPEX Test Expert - Smart guidance for the right test.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-xl border border-[#f1dfce] bg-white px-4 py-2 text-sm font-semibold text-[#0D0D0D] transition hover:border-[#F7931E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7931E]"
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(100vh-9.5rem)] overflow-y-auto p-4 md:p-5">
              {!withinHours ? (
                <p className="mb-4 rounded-2xl border border-[#ffd6bd] bg-[#fff7f1] px-4 py-3 text-sm text-[#7d5a45]">
                  Advisor booking is available between 10:00 AM and 6:00 PM IST.
                </p>
              ) : null}
              <HealthAdvisorForm surfaceClassName="rounded-[26px] border border-[#f1dfce] bg-[#FFF8F2] p-4 md:p-5" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
