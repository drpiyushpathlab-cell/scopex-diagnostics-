"use client";

import Link from "next/link";
import Image from "next/image";

const whatsappNumber = "918989273440";

export function FloatingActions() {
  const triggerAdvisor = () => {
    window.dispatchEvent(new CustomEvent("scopex:open-advisor"));
  };

  return (
    <div className="fixed bottom-3 left-1/2 z-[60] w-[calc(100%-1.25rem)] max-w-md -translate-x-1/2 rounded-2xl border border-white/20 bg-black/90 p-2 shadow-2xl backdrop-blur">
      <div className="grid grid-cols-3 gap-2">
        <Link
          href="/book-home-collection"
          className="group flex h-20 cursor-pointer flex-col items-center justify-center rounded-xl bg-scopex-orange/40 text-white shadow-glow transition hover:bg-scopex-orange/55"
          aria-label="Home Collection (Click now - Book home collection)"
          title="Home Collection (Click now - Book home collection)"
        >
          <Image src="/icons/home-visit.png" alt="Home Collection" width={26} height={26} className="h-6 w-6 object-contain" />
          <span className="mt-1 text-[12px] font-extrabold uppercase tracking-[0.11em] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">HOME</span>
        </Link>

        <Link
          href={`https://wa.me/${whatsappNumber}?text=Hi%20SCOPEX%2C%20I%20want%20to%20book%20a%20test%20on%20WhatsApp`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex h-20 cursor-pointer flex-col items-center justify-center rounded-xl bg-green-600/95 text-white transition hover:brightness-110"
          aria-label="WhatsApp Booking (Click now - Test booking on WhatsApp)"
          title="WhatsApp Booking (Click now - Test booking on WhatsApp)"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M12.03 2A9.95 9.95 0 0 0 3.4 16.97L2 22l5.16-1.35A10 10 0 1 0 12.03 2Zm0 18.2a8.2 8.2 0 0 1-4.16-1.13l-.3-.18-3.06.8.82-2.98-.2-.31a8.2 8.2 0 1 1 6.9 3.8Zm4.5-6.15c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.56.12-.17.25-.65.8-.8.97-.15.17-.3.19-.56.06-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.1-.51.11-.11.25-.3.37-.45.12-.14.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.76-1.84-.2-.48-.4-.41-.56-.41h-.48c-.17 0-.43.06-.65.31-.23.25-.87.85-.87 2.07 0 1.22.9 2.4 1.02 2.56.12.17 1.77 2.7 4.28 3.79.6.26 1.07.42 1.43.54.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29Z" />
          </svg>
          <span className="mt-1 text-[12px] font-extrabold uppercase tracking-[0.11em] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">WA</span>
        </Link>

        <button
          type="button"
          onClick={triggerAdvisor}
          className="group flex h-20 cursor-pointer flex-col items-center justify-center rounded-xl bg-scopex-orange/40 text-white shadow-glow transition hover:bg-scopex-orange/55"
          aria-label="SCOPEX Test Expert (Advisor) (Click now - Get expert guidance)"
          title="SCOPEX Test Expert (Advisor) (Click now - Get expert guidance)"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M4 20a8 8 0 0 1 16 0" />
          </svg>
          <span className="mt-1 text-[12px] font-extrabold uppercase tracking-[0.11em] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">ADVISOR</span>
        </button>
      </div>
    </div>
  );
}
