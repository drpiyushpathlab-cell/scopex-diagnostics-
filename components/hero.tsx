"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const popularTests = [
  { label: "CBC", href: "/tests?focus=basic-tests&filter=blood&search=cbc" },
  { label: "Lipid Profile", href: "/tests?focus=profile-tests&filter=profile&search=lipid" },
  { label: "Thyroid", href: "/tests?focus=profile-tests&filter=profile&search=thyroid" },
  { label: "Vitamin D", href: "/tests?focus=hormone-special-tests&filter=hormone&search=vitamin%20d" },
  { label: "HbA1c", href: "/tests?focus=basic-tests&filter=blood&search=hba1c" },
  { label: "LFT", href: "/tests?focus=organ-function-tests&filter=profile&search=liver" }
];

const markers = [
  ["CBC", "Blood health"],
  ["HbA1c", "Sugar trend"],
  ["TSH", "Thyroid"],
  ["Lipid", "Heart risk"]
];

export function Hero() {
  const [query, setQuery] = useState("");
  const searchHref = useMemo(() => {
    const value = query.trim();
    return value ? `/tests?search=${encodeURIComponent(value)}` : "/tests";
  }, [query]);

  return (
    <section id="hero" className="bg-white">
      <div className="section-wrap py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#F7931E]">Real Price Diagnostics</p>
            <h1 className="mt-4 max-w-4xl text-[3.2rem] font-black leading-[0.96] text-[#0D0D0D] md:text-[5.6rem] lg:text-[5.2rem]">
              Book blood tests at home without fake discounts.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#5f6868] md:text-xl md:leading-9">
              ScopeX shows one managed real price for every test, applies bundle savings transparently, and handles home collection with trained partners.
            </p>

            <div className="mt-7 max-w-2xl rounded-lg border border-[#E8E2DC] bg-[#FAFAF8] p-2 shadow-[0_18px_50px_rgba(13,13,13,0.06)]">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search CBC, thyroid, diabetes, vitamin D"
                  className="min-h-[54px] rounded-md border border-transparent bg-white px-4 text-sm text-[#0D0D0D] outline-none transition placeholder:text-[#8A8A8A] focus:border-[#F7931E]"
                />
                <Link href={searchHref} className="cta-btn min-h-[54px] rounded-md px-7">
                  Search Tests
                </Link>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {popularTests.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full border border-[#E8E2DC] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#0D0D0D] transition hover:border-[#F7931E] hover:text-[#F7931E]"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/book-home-collection" className="cta-btn rounded-md">
                Book Home Collection
              </Link>
              <Link href="/packages" className="secondary-btn rounded-md">
                View Packages
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Rs. 600+", "free home collection threshold"],
                ["Real price", "no fabricated reference price"],
                ["Digital", "reports and booking tracking"]
              ].map(([value, label]) => (
                <div key={value} className="border-l-2 border-[#F7931E] pl-4">
                  <p className="text-2xl font-black text-[#0D0D0D]">{value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#6F6F6F]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-[#E8E2DC] bg-[#0D0D0D] p-4 text-white shadow-[0_24px_70px_rgba(13,13,13,0.22)]">
              <div className="rounded-md bg-white p-5 text-[#0D0D0D]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F7931E]">Your health snapshot</p>
                    <h2 className="mt-2 text-3xl font-black">ScopeX Report</h2>
                  </div>
                  <div className="rounded-md bg-[#FFF3E5] px-3 py-2 text-right">
                    <p className="text-3xl font-black text-[#F7931E]">82</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6F6F6F]">Score</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {markers.map(([name, label], index) => (
                    <div key={name} className="rounded-md border border-[#EFE7DF] bg-[#FAFAF8] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black">{name}</p>
                          <p className="text-xs text-[#6F6F6F]">{label}</p>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#F7931E]">{index === 2 ? "Watch" : "Good"}</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-[#EFE7DF]">
                        <div className="h-full rounded-full bg-[#F7931E]" style={{ width: `${82 - index * 12}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-white/15 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/60">Next slot</p>
                  <p className="mt-2 text-xl font-black">7:00 AM</p>
                  <p className="mt-1 text-sm text-white/70">Home collection</p>
                </div>
                <div className="rounded-md border border-white/15 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/60">Care flow</p>
                  <p className="mt-2 text-xl font-black">Book Track Report</p>
                  <p className="mt-1 text-sm text-white/70">One patient dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
