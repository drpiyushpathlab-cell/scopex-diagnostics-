"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";

const links = [
  { href: "/#hero", label: "Home" },
  { href: "/#packages", label: "Packages" },
  { href: "/#individual-tests", label: "Individual Tests" },
  { href: "/#why-scopex", label: "Why Scopex" },
  { href: "/#how-it-works", label: "Process" }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[var(--bg)]/95 backdrop-blur dark:border-white/10">
      <div className="border-b border-scopex-orange/45 bg-scopex-orange/12 py-2 sm:py-2.5">
        <div className="section-wrap">
          <span className="mx-auto block max-w-5xl text-center text-[13px] font-semibold leading-[1.35] tracking-[0.01em] text-scopex-orange sm:text-[15px]">
            Get up to an extra 15% off* on First Home Collection | Family Saver Offer: additional 15% off on multi-member bookings
            | *T&amp;C apply
          </span>
        </div>
      </div>
      <div className="section-wrap flex h-16 items-center justify-between">
        <BrandLogo compact />
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium uppercase tracking-[0.1em] hover:text-scopex-orange">
              {link.label}
            </Link>
          ))}
          <Link href="/book-home-collection" className="cta-btn px-4 py-2 text-xs">
            BOOK HOME COLLECTION
          </Link>
          <ThemeToggle />
        </nav>
        <button
          type="button"
          className="rounded-lg border border-white/50 bg-black/45 p-2 text-xs uppercase text-white shadow-[0_0_0_1px_rgba(243,112,33,0.2)]"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
      {open ? (
        <div className="section-wrap space-y-4 border-t border-white/10 py-5 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium uppercase tracking-[0.1em] hover:border-scopex-orange/40"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/book-home-collection" className="cta-btn mt-1 w-full text-center text-xs" onClick={() => setOpen(false)}>
            BOOK HOME COLLECTION
          </Link>
          <ThemeToggle />
        </div>
      ) : null}
    </header>
  );
}
