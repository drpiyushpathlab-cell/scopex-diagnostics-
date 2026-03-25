"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

const links = [
  { href: "/#hero", label: "Home" },
  { href: "/#packages", label: "Packages" },
  { href: "/#why-scopex", label: "Trust" }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#deece9] bg-white/95 backdrop-blur">
      <div className="border-b border-[#deece9] bg-[#f7fbfa] py-1.5">
        <div className="section-wrap text-center text-[12px] font-semibold text-[#0f8f7c] sm:text-[13px]">
          Get 15% OFF on First Booking | Free Home Collection
        </div>
      </div>

      <div className="section-wrap flex flex-wrap items-center gap-2.5 py-2 md:flex-nowrap">
        <BrandLogo compact />

        <Link
          href="/tests"
          className="hidden min-w-0 flex-1 items-center rounded-full border border-[#dbe9e7] bg-[#f7fbfa] px-4 py-2.5 text-sm text-[#688082] md:flex"
          aria-label="Search tests"
        >
          Search tests, packages, thyroid, diabetes
        </Link>

        <nav className="hidden items-center gap-4 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-semibold uppercase tracking-[0.08em] text-[#264547] hover:text-[#0f8f7c]">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 md:flex">
          <Link href="/contact" className="rounded-full border border-[#dbe9e7] px-4 py-1.5 text-sm font-semibold text-[#264547]">
            Login
          </Link>
          <Link href="/book-home-collection" className="cta-btn px-5 py-2 text-xs">
            Book Test
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#dbe9e7] bg-white text-[#264547] shadow-[0_8px_20px_rgba(16,24,40,0.08)] md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="section-wrap space-y-3 border-t border-[#deece9] py-4 md:hidden">
          <Link href="/tests" className="block rounded-2xl border border-[#deece9] bg-[#f7fbfa] px-4 py-3 text-sm text-[#688082]" onClick={() => setOpen(false)}>
            Search tests, packages, thyroid, diabetes
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl border border-[#deece9] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#264547]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className="block rounded-xl border border-[#deece9] px-4 py-3 text-sm font-semibold text-[#264547]" onClick={() => setOpen(false)}>
            Login
          </Link>
          <Link href="/book-home-collection" className="cta-btn w-full text-center text-xs" onClick={() => setOpen(false)}>
            Book Test
          </Link>
        </div>
      ) : null}
    </header>
  );
}
