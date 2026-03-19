"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function HomeOfferPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("scopex-offer-seen");
    if (alreadySeen) return;
    const timer = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)] p-7 text-[var(--text)] shadow-2xl">
        <button
          onClick={() => {
            sessionStorage.setItem("scopex-offer-seen", "1");
            setOpen(false);
          }}
          className="absolute right-4 top-4 rounded-md border border-black/20 bg-white px-3 py-1 text-sm font-semibold text-black shadow-sm dark:border-white/20 dark:bg-black dark:text-white"
          type="button"
        >
          Close
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-scopex-orange">Home Visit Offer</p>
        <h3 className="mt-2 text-2xl font-bold">Get up to an extra 15% off* on First Home Collection</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Family Saver Offer: enjoy an additional 15% off when booking tests for multiple family members. *T&C apply.
        </p>
        <Link href="/book-home-collection" className="cta-btn mt-6 w-full text-center">
          BOOK HOME COLLECTION
        </Link>
        <p className="mt-3 text-[11px] text-[var(--muted)]">*T&amp;C apply</p>
      </div>
    </div>
  );
}
