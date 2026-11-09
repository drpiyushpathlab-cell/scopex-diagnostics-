"use client";

import { useState, useEffect } from "react";
import { X, Phone, User, MapPin, Mail, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { submitLead } from "@/lib/lead-submit";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemType: "test" | "package";
  itemId: string;
  itemName: string;
  itemPrice?: number;
};

export function QuickLeadModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemName,
  itemPrice
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Indore");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [preferredSlot, setPreferredSlot] = useState("Morning (7:00 AM - 10:00 AM)");
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      setUtmParams({
        utm_source: url.searchParams.get("utm_source") || "website",
        utm_medium: url.searchParams.get("utm_medium") || "organic",
        utm_campaign: url.searchParams.get("utm_campaign") || "",
        campaign: url.searchParams.get("campaign") || `${itemType}_detail_page`
      });
    }
  }, [itemType]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!consent) {
      setMessage("Please provide consent to contact you.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload: Record<string, unknown> = {
        leadType: "home_collection",
        name: name.trim(),
        mobileNumber: cleanPhone,
        officialEmail: email.trim() || undefined,
        city: city.trim(),
        address: address.trim() || `Pincode: ${pincode}`,
        preferredTime: "8:00 AM - 9:00 AM",
        age: 30, // standard default for quick enquiry
        collectionDate: new Date().toISOString().split("T")[0],
        testId: itemType === "test" ? itemId : undefined,
        testName: itemType === "test" ? itemName : undefined,
        testPrice: itemType === "test" ? itemPrice : undefined,
        packageId: itemType === "package" ? itemId : undefined,
        packageName: itemType === "package" ? itemName : undefined,
        packagePrice: itemType === "package" ? itemPrice : undefined,
        source: `${itemType}_page`,
        campaign: utmParams.campaign,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        pincode: pincode.trim(),
        consent: true
      };

      await submitLead(payload as any, "/api/enquiry");

      setSuccess(true);
      setMessage("Request received! Our diagnostic care specialist will call you within 15 minutes.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to submit enquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#f1dfce] bg-white p-6 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-stone-900">Enquiry Submitted!</h3>
            <p className="mt-2 text-sm text-stone-600">{message}</p>
            <div className="mt-6 rounded-2xl bg-stone-50 p-4 text-left text-xs text-stone-600 space-y-1 border border-stone-200">
              <p><span className="font-semibold text-stone-800">Selected:</span> {itemName}</p>
              {itemPrice ? <p><span className="font-semibold text-stone-800">Price:</span> ₹{itemPrice}</p> : null}
              <p><span className="font-semibold text-stone-800">Phone:</span> +91 {phone}</p>
              <p><span className="font-semibold text-stone-800">City:</span> {city}</p>
            </div>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-[#0D0D0D] py-3 text-sm font-bold text-white transition hover:bg-[#FF6B00]"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#FFF4E8] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
                Quick Callback Request
              </span>
            </div>
            <h3 className="mt-2 text-xl sm:text-2xl font-black text-stone-900">
              Book or Enquire for {itemType === "test" ? "Test" : "Package"}
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              Enquiring for: <strong className="text-stone-800">{itemName}</strong>
              {itemPrice ? ` (₹${itemPrice})` : ""}
            </p>

            {message ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800 border border-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700">Full Name *</label>
                <div className="relative mt-1">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter patient or contact name"
                    className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-3.5 text-sm focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700">Mobile Number (WhatsApp) *</label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                    <input
                      required
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="10-digit number"
                      className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-3.5 text-sm focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700">Email Address (Optional)</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-3.5 text-sm focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700">City *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-300 py-2.5 px-3 text-sm focus:border-[#FF6B00] focus:outline-none bg-white"
                  >
                    <option value="Indore">Indore</option>
                    <option value="Bhopal">Bhopal</option>
                    <option value="Lucknow">Lucknow</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Other">Other City</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700">PIN Code</label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 452001"
                      className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-3.5 text-sm focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700">Preferred Contact Time</label>
                <select
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-sm focus:border-[#FF6B00] focus:outline-none bg-white"
                >
                  <option value="Morning (7:00 AM - 10:00 AM)">Morning (7:00 AM - 10:00 AM)</option>
                  <option value="Afternoon (11:00 AM - 2:00 PM)">Afternoon (11:00 AM - 2:00 PM)</option>
                  <option value="Evening (4:00 PM - 8:00 PM)">Evening (4:00 PM - 8:00 PM)</option>
                  <option value="Call Immediately">Call Immediately</option>
                </select>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="lead-consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                />
                <label htmlFor="lead-consent" className="text-[11px] leading-relaxed text-stone-500">
                  I agree to receive test guidance, booking updates, and report delivery alerts from ScopeX Diagnostics via WhatsApp/SMS/Call.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D0D0D] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#FF6B00] disabled:opacity-60"
              >
                {loading ? "Connecting..." : "Request Call / Book at Home"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
