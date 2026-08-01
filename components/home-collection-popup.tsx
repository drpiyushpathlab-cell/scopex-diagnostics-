"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const storageKey = "scopex-home-collection-popup-seen-at";
const cooldownMs = 7 * 24 * 60 * 60 * 1000;
const formSubmitEndpoint = "https://formsubmit.co/ajax/scopex.lab@gmail.com";
const mobileRegex = /^[6-9]\d{9}$/;

type SubmitState = "idle" | "loading" | "success" | "error";

type HomeCollectionForm = {
  fullName: string;
  mobileNumber: string;
  city: string;
};

const initialForm: HomeCollectionForm = {
  fullName: "",
  mobileNumber: "",
  city: ""
};

function shouldShowPopup() {
  try {
    const seenAt = window.localStorage.getItem(storageKey);
    if (!seenAt) return true;
    return Date.now() - Number(seenAt) > cooldownMs;
  } catch {
    return true;
  }
}

function markPopupSeen() {
  try {
    window.localStorage.setItem(storageKey, String(Date.now()));
  } catch {
    // localStorage can be unavailable in private browser modes.
  }
}

export function HomeCollectionPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const sanitizedMobile = form.mobileNumber.replace(/\D/g, "");
  const isFormValid = Boolean(
    form.fullName.trim() &&
    form.city.trim() &&
    mobileRegex.test(sanitizedMobile)
  );

  useEffect(() => {
    const openFromAction = () => {
      setHasTriggered(true);
      setOpen(true);
    };

    window.addEventListener("scopex:open-home-collection", openFromAction as EventListener);
    return () => window.removeEventListener("scopex:open-home-collection", openFromAction as EventListener);
  }, []);

  useEffect(() => {
    if (pathname !== "/" || !shouldShowPopup()) return;

    let didTrigger = false;
    const showPopup = () => {
      if (didTrigger) return;
      didTrigger = true;
      setHasTriggered(true);
      setOpen(true);
    };

    const timer = window.setTimeout(showPopup, 8000);
    const onScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;
      const scrollPercent = window.scrollY / scrollableHeight;
      if (scrollPercent >= 0.5) {
        window.clearTimeout(timer);
        showPopup();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopup();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function updateField<T extends keyof HomeCollectionForm>(key: T, value: HomeCollectionForm[T]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (status !== "idle") {
      setStatus("idle");
      setMessage("");
    }
  }

  function closePopup() {
    markPopupSeen();
    setOpen(false);
  }

  function openAdvisor() {
    markPopupSeen();
    setOpen(false);
    window.dispatchEvent(new Event("scopex:open-advisor"));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    if (!form.fullName.trim()) {
      setStatus("error");
      setMessage("Please enter your full name.");
      return;
    }
    if (!mobileRegex.test(sanitizedMobile)) {
      setStatus("error");
      setMessage("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!form.city.trim()) {
      setStatus("error");
      setMessage("Please enter your city.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("_subject", "New Home Collection Enquiry");
      formData.append("_template", "table");
      formData.append("_captcha", "false");
      formData.append("leadType", "Home Collection Popup");
      formData.append("name", form.fullName.trim());
      formData.append("mobile", sanitizedMobile);
      formData.append("city", form.city.trim());
      formData.append("sourcePage", window.location.href);
      formData.append("timestamp", new Date().toISOString());

      const response = await fetch(formSubmitEndpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Unable to submit enquiry. Please try again.");
      }

      markPopupSeen();
      setStatus("success");
      setMessage("Our healthcare team will contact you shortly to schedule your home sample collection.");
      setForm(initialForm);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit enquiry. Please try again.");
    }
  }

  if (!open || !hasTriggered) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#0D0D0D]/45 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="home-collection-popup-title">
      <div className="home-collection-popup-panel relative w-full max-w-[450px] rounded-[20px] border border-[#f1dfce] bg-white p-5 text-[#0D0D0D] shadow-[0_24px_70px_rgba(13,13,13,0.22)] md:p-6">
        <button type="button" onClick={closePopup} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#f1dfce] bg-[#FFF8F2] text-2xl leading-none text-[#0D0D0D] transition hover:-translate-y-0.5 hover:border-[#F7931E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7931E]" aria-label="Close home collection popup">
          ×
        </button>

        <div className="pr-12">
          <p className="inline-flex rounded-full border border-[#f7d7bb] bg-[#FFF8F2] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#F7931E]">🎉 FREE Home Sample Collection*</p>
          <h2 id="home-collection-popup-title" className="mt-4 text-2xl font-bold leading-tight text-[#0D0D0D]">🏠 Book Home Sample Collection</h2>
          <p className="mt-2 text-sm leading-6 text-[#5f6868]">Book your blood test at home in just one click</p>
        </div>

        {status === "success" ? (
          <div className="mt-5 rounded-[18px] border border-[#f1dfce] bg-[#FFF8F2] p-5 text-center" role="status">
            <h3 className="text-2xl font-bold text-[#0D0D0D]">Thank you!</h3>
            <p className="mt-3 text-sm leading-7 text-[#5f6868]">{message}</p>
            <button type="button" onClick={() => setOpen(false)} className="cta-btn mt-5 w-full">Close</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5" noValidate>
            <div className="space-y-3">
              <input required value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Full Name *" className="form-field" aria-label="Full Name" />
              <input required value={form.mobileNumber} onChange={(e) => updateField("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile Number *" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" className="form-field" aria-label="Mobile Number" />
              <input required value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City *" className="form-field" aria-label="City" />
            </div>

            {message ? (
              <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{message}</p>
            ) : null}

            <button type="submit" disabled={!isFormValid || status === "loading"} className="cta-btn mt-5 w-full disabled:pointer-events-none disabled:opacity-50">
              {status === "loading" ? "Submitting..." : "Get Free Callback"}
            </button>
            <button type="button" onClick={openAdvisor} className="secondary-btn mt-3 w-full">
              💬 Talk to Health Advisor
            </button>
            <p className="mt-3 text-center text-[11px] leading-5 text-[#7d6c60]">*T&amp;C Apply. Availability may vary by location.</p>
          </form>
        )}
      </div>
    </div>
  );
}




