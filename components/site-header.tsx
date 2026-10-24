"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { getDashboardHrefForRole, getStoredAuthUser, onAuthChange, type StoredAuthUser } from "@/lib/backend-client";
import { Scale } from "lucide-react";
import { useCompare } from "@/lib/compare-context";

const links = [
  { href: "/", label: "Home" },
  { href: "/tests", label: "Tests" },
  { href: "/packages", label: "Packages" },
  { href: "/growth-partners", label: "For Partners" },
  { href: "/about", label: "About" }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authUser, setAuthUser] = useState<StoredAuthUser | null>(null);
  const { selectedItems, openModal } = useCompare();
  const pathname = usePathname();
  const isGrowthPartnersPage = pathname === "/growth-partners";
  const dashboardHref = authUser ? getDashboardHrefForRole(authUser.role) : "";
  const dashboardLabel =
    authUser?.role === "admin"
      ? "Admin Dashboard"
      : authUser?.role === "super-admin" || authUser?.role === "super_admin"
      ? "Super Admin Dashboard"
      : "Patient Dashboard";

  useEffect(() => {
    const syncAuth = () => setAuthUser(getStoredAuthUser());
    syncAuth();
    return onAuthChange(syncAuth);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[#EAEAEA] bg-white/95 backdrop-blur">
      <div
        className={`border-b py-1 sm:py-1.5 ${
          isGrowthPartnersPage
            ? "border-[#FF6B00]/20 bg-[#FF6B00]"
            : "border-[#EAEAEA] bg-[#FFF4E8]"
        }`}
      >
        <div
          className={`section-wrap text-center text-[11px] sm:text-xs font-semibold tracking-wide truncate ${
            isGrowthPartnersPage ? "text-white" : "text-[#FF6B00]"
          }`}
        >
          {isGrowthPartnersPage
            ? "Pan India Network • Enterprise Solutions • Dedicated Business Support"
            : "Real Prices. Faster Diagnostics. Better Guidance. • Free Home Collection*"}
        </div>
      </div>

      <div className="section-wrap flex items-center justify-between py-2.5 sm:py-3.5">
        {/* ScopeX logo on the left */}
        <BrandLogo compact />

        {/* Navigation: Home, Tests, Packages, Growth Partners */}
        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => {
            const isActive =
              (link.label === "Home" && (pathname === "/" || pathname === "/#hero")) ||
              (link.label === "Tests" && pathname.startsWith("/tests")) ||
              (link.label === "Packages" && pathname.startsWith("/packages")) ||
              (link.label === "Growth Partners" && pathname.startsWith("/growth-partners"));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-[#FF6B00]"
                    : "text-[#0D0D0D] hover:text-[#FF6B00]"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#FF6B00]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions: Compare + Login + Bright Orange BOOK TEST button */}
        <div className="hidden items-center gap-3 md:flex">
          {selectedItems.length > 0 && (
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-800 bg-[#0D0D0D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#FF6B00] transition cursor-pointer shadow-xs"
              title="View side-by-side comparison"
            >
              <Scale className="h-3.5 w-3.5 text-[#FF6B00]" />
              <span>Compare ({selectedItems.length}/3)</span>
            </button>
          )}

          {authUser && dashboardHref ? (
            <Link
              href={dashboardHref}
              title={dashboardLabel}
              aria-label={dashboardLabel}
              className="group inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAEAEA] bg-white text-[#FF6B00] transition hover:border-[#FF6B00] hover:bg-[#FFF4E8]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 10v10h14V10" />
                <path d="M9 20v-6h6v6" />
              </svg>
              <span className="sr-only">{dashboardLabel}</span>
            </Link>
          ) : (
            <Link
              href="/patient/login"
              className="rounded-xl border border-[#EAEAEA] bg-white px-5 py-2 text-xs font-bold text-[#0D0D0D] transition hover:border-[#FF6B00] hover:text-[#FF6B00]"
            >
              Login
            </Link>
          )}

          <Link
            href="/book-home-collection"
            className="cta-btn rounded-xl px-5 py-2.5 text-xs font-extrabold tracking-wider"
          >
            BOOK TEST
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAEAEA] bg-white text-[#111111] transition hover:border-[#FF7900] md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="section-wrap space-y-2.5 border-t border-[#EAEAEA] py-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl border border-[#EAEAEA] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-[#111111] transition hover:border-[#FF7900] hover:text-[#FF7900]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {selectedItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openModal();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-800 bg-[#0D0D0D] px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              <Scale className="h-4 w-4 text-[#FF6B00]" />
              <span>Compare Selected ({selectedItems.length}/3)</span>
            </button>
          )}

          {authUser && dashboardHref ? (
            <Link
              href={dashboardHref}
              className="flex items-center gap-2.5 rounded-xl border border-[#FF7900]/30 bg-[#FFF7ED] px-4 py-2.5 text-xs font-bold text-[#FF7900]"
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 10v10h14V10" />
                <path d="M9 20v-6h6v6" />
              </svg>
              <span>{dashboardLabel}</span>
            </Link>
          ) : (
            <Link
              href="/patient/login"
              className="block rounded-xl border border-[#EAEAEA] px-4 py-2.5 text-xs font-bold text-[#111111]"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          )}

          <Link
            href="/book-home-collection"
            className="cta-btn w-full text-center text-xs font-bold tracking-wider"
            onClick={() => setOpen(false)}
          >
            BOOK TEST
          </Link>
        </div>
      ) : null}
    </header>
  );
}
