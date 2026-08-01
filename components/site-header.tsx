"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { getDashboardHrefForRole, getStoredAuthUser, onAuthChange, type StoredAuthUser } from "@/lib/backend-client";

const links = [
  { href: "/#hero", label: "Home" },
  { href: "/#packages", label: "Packages" },
  { href: "/#why-scopex", label: "Trust" },
  { href: "/growth-partners", label: "Growth Partners" }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authUser, setAuthUser] = useState<StoredAuthUser | null>(null);
  const pathname = usePathname();
  const isGrowthPartnersPage = pathname === "/growth-partners";
  const dashboardHref = authUser ? getDashboardHrefForRole(authUser.role) : "";
  const dashboardLabel = authUser?.role === "admin" ? "Admin Dashboard" : authUser?.role === "super-admin" || authUser?.role === "super_admin" ? "Super Admin Dashboard" : "Patient Dashboard";

  useEffect(() => {
    const syncAuth = () => setAuthUser(getStoredAuthUser());
    syncAuth();
    return onAuthChange(syncAuth);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[#f1dfce] bg-white/95 backdrop-blur">
      <div className={`border-b py-1.5 ${isGrowthPartnersPage ? "border-[#F7931E]/20 bg-[#F7931E]" : "border-[#f1dfce] bg-[#FFF8F2]"}`}>
        <div className={`section-wrap text-center text-[12px] font-semibold sm:text-[13px] ${isGrowthPartnersPage ? "text-white" : "text-[#F7931E]"}`}>
          {isGrowthPartnersPage
            ? "Pan India Network • Enterprise Solutions • Dedicated Business Support"
            : "Get 15% OFF on First Booking | Free Home Collection"}
        </div>
      </div>

      <div className="section-wrap flex flex-wrap items-center gap-2.5 py-2 md:flex-nowrap">
        <BrandLogo compact />

        <Link
          href="/tests"
          className="hidden min-w-0 flex-1 items-center rounded-full border border-[#f1dfce] bg-[#FFF8F2] px-4 py-2.5 text-sm text-[#688082] md:flex"
          aria-label="Search tests"
        >
          Search tests, packages, thyroid, diabetes
        </Link>

        <nav className="hidden items-center gap-4 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-semibold uppercase tracking-[0.08em] text-[#264547] hover:text-[#F7931E]">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 md:flex">
          {authUser && dashboardHref ? (
            <Link
              href={dashboardHref}
              title={dashboardLabel}
              aria-label={dashboardLabel}
              className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#f7d7bb] bg-[#effaf7] text-[#F7931E] transition hover:border-[#F7931E] hover:bg-white hover:text-[#F7931E]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 10v10h14V10" />
                <path d="M9 20v-6h6v6" />
              </svg>
              <span className="sr-only">{dashboardLabel}</span>
            </Link>
          ) : (
            <Link href="/patient/login" className="rounded-full border border-[#f1dfce] px-4 py-1.5 text-sm font-semibold text-[#264547]">
              Login
            </Link>
          )}
          <Link href="/book-home-collection" className="cta-btn px-5 py-2 text-xs">
            Book Test
          </Link>
        </div>

        {authUser && dashboardHref ? (
          <Link
            href={dashboardHref}
            title={dashboardLabel}
            aria-label={dashboardLabel}
            className="ml-auto inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#f7d7bb] bg-[#effaf7] text-[#F7931E] shadow-[0_8px_20px_rgba(16,24,40,0.08)] transition hover:text-[#F7931E] md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 10v10h14V10" />
              <path d="M9 20v-6h6v6" />
            </svg>
            <span className="sr-only">{dashboardLabel}</span>
          </Link>
        ) : null}

        <button
          type="button"
          className={`${authUser ? "" : "ml-auto"} inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#f1dfce] bg-white text-[#264547] shadow-[0_8px_20px_rgba(16,24,40,0.08)] md:hidden`}
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="section-wrap space-y-3 border-t border-[#f1dfce] py-4 md:hidden">
          <Link href="/tests" className="block rounded-2xl border border-[#f1dfce] bg-[#FFF8F2] px-4 py-3 text-sm text-[#688082]" onClick={() => setOpen(false)}>
            Search tests, packages, thyroid, diabetes
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl border border-[#f1dfce] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#264547]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {authUser && dashboardHref ? (
            <Link href={dashboardHref} className="flex items-center gap-3 rounded-xl border border-[#f1dfce] bg-[#effaf7] px-4 py-3 text-sm font-bold text-[#F7931E]" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 10v10h14V10" />
                <path d="M9 20v-6h6v6" />
              </svg>
              {dashboardLabel}
            </Link>
          ) : (
            <Link href="/patient/login" className="block rounded-xl border border-[#f1dfce] px-4 py-3 text-sm font-semibold text-[#264547]" onClick={() => setOpen(false)}>
              Login
            </Link>
          )}
          <Link href="/book-home-collection" className="cta-btn w-full text-center text-xs" onClick={() => setOpen(false)}>
            Book Test
          </Link>
        </div>
      ) : null}
    </header>
  );
}
