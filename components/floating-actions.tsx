"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const whatsappNumber = "918989273440";
const whatsappMessage = "Hi%20SCOPEX%2C%20I%20want%20to%20book%20a%20test%20on%20WhatsApp";
const growthPartnerMessage = encodeURIComponent(`Hello ScopeX Diagnostics,

I am interested in becoming a Growth Partner.

Please share details about your partnership models.

Company Name:
City:
Business Type:
Contact Number:`);

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.03 2A9.95 9.95 0 0 0 3.4 16.97L2 22l5.16-1.35A10 10 0 1 0 12.03 2Zm0 18.2a8.2 8.2 0 0 1-4.16-1.13l-.3-.18-3.06.8.82-2.98-.2-.31a8.2 8.2 0 1 1 6.9 3.8Zm4.5-6.15c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.56.12-.17.25-.65.8-.8.97-.15.17-.3.19-.56.06-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.1-.51.11-.11.25-.3.37-.45.12-.14.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.76-1.84-.2-.48-.4-.41-.56-.41h-.48c-.17 0-.43.06-.65.31-.23.25-.87.85-.87 2.07 0 1.22.9 2.4 1.02 2.56.12.17 1.77 2.7 4.28 3.79.6.26 1.07.42 1.43.54.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}

export function FloatingActions() {
  const pathname = usePathname();

  if (pathname === "/growth-partners") {
    return (
      <Link
        href={`https://wa.me/${whatsappNumber}?text=${growthPartnerMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-[60] flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_28px_rgba(37,211,102,0.32)] transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(37,211,102,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
        aria-label="Contact ScopeX Diagnostics on WhatsApp for Growth Partner enquiry"
        title="Contact on WhatsApp"
      >
        <WhatsAppIcon className="h-5 w-5 sm:h-7 sm:w-7" />
      </Link>
    );
  }

  function openHomeCollectionPopup() {
    window.dispatchEvent(new Event("scopex:open-home-collection"));
  }

  return (
    <div
      className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[60] flex flex-col items-end gap-2 sm:gap-3.5 pb-[env(safe-area-inset-bottom)] pointer-events-auto"
      aria-label="ScopeX quick actions"
    >
      <button
        type="button"
        onClick={openHomeCollectionPopup}
        className="group inline-flex h-11 w-11 sm:h-13 sm:w-13 md:h-14 md:w-14 items-center justify-center overflow-hidden rounded-full bg-[#FF6600] text-white shadow-[0_10px_24px_rgba(255,102,0,0.34)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6600] md:justify-start md:px-[18px] md:hover:w-[170px]"
        aria-label="Open Get Callback popup"
        title="Get Callback"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.74a16 16 0 0 0 6.26 6.26l1.28-1.28a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
        </svg>
        <span className="ml-3 hidden whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:inline font-bold text-xs uppercase tracking-wider">
          Get Callback
        </span>
      </button>

      <Link
        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex h-11 w-11 sm:h-13 sm:w-13 md:h-14 md:w-14 items-center justify-center overflow-hidden rounded-full bg-[#25D366] text-white shadow-[0_10px_24px_rgba(37,211,102,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] md:justify-start md:px-[18px] md:hover:w-[170px]"
        aria-label="Open WhatsApp chat"
        title="WhatsApp"
      >
        <WhatsAppIcon className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
        <span className="ml-3 hidden whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:inline font-bold text-xs uppercase tracking-wider">
          WhatsApp
        </span>
      </Link>
    </div>
  );
}
