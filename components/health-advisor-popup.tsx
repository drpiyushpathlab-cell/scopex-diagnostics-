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
          <div className="w-full max-w-lg rounded-[30px] border border-[#deece9] bg-white p-4 text-[var(--text)] shadow-[0_24px_60px_rgba(16,24,40,0.18)] md:p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0f8f7c]">10 AM - 6 PM</p>
                <h3 className="text-xl font-bold text-[#102a2d]">Talk to a Health Advisor</h3>
                <p className="mt-1 text-xs text-[#5d7476]">SCOPEX Test Expert - Smart guidance for the right test.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[#dbe9e7] bg-white px-3 py-1.5 text-sm font-semibold text-[#102a2d]"
              >
                Close
              </button>
            </div>
            {!withinHours ? (
              <p className="mb-4 rounded-2xl border border-[#ffd6bd] bg-[#fff7f1] px-4 py-3 text-sm text-[#7d5a45]">
                Advisor booking is available between 10:00 AM and 6:00 PM IST.
              </p>
            ) : null}
            <HealthAdvisorForm surfaceClassName="rounded-[26px] border border-[#deece9] bg-[#f7fbfa] p-4 md:p-5" />
          </div>
        </div>
      ) : null}
    </>
  );
}
