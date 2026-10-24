"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { testsData } from "@/lib/data";
import { Search, Clock, Droplet, ChevronDown, ChevronUp, ArrowRight, ShieldCheck, Sparkles, Scale } from "lucide-react";
import { useCompare, testToComparable } from "@/lib/compare-context";

const filters = ["All", "Blood", "Hormone", "Profile"] as const;
const groups = ["Basic Tests", "Profile Tests", "Organ Function Tests", "Hormone & Special Tests"] as const;

const focusMap: Record<string, (typeof groups)[number] | undefined> = {
  "basic-tests": "Basic Tests",
  "profile-tests": "Profile Tests",
  "organ-function-tests": "Organ Function Tests",
  "hormone-special-tests": "Hormone & Special Tests"
};

const filterMap: Record<string, (typeof filters)[number] | undefined> = {
  all: "All",
  blood: "Blood",
  hormone: "Hormone",
  profile: "Profile"
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function TestsCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const urlFocus = searchParams.get("focus") ?? "";
  const urlFilter = searchParams.get("filter") ?? "";
  const normalizedUrlFilter = filterMap[urlFilter.toLowerCase()] ?? "All";

  const [search, setSearch] = useState(urlSearch);
  const [filter, setFilter] = useState<(typeof filters)[number]>(normalizedUrlFilter);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { toggleItem, isItemComparing, selectedItems, openModal } = useCompare();

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setFilter(normalizedUrlFilter);
  }, [normalizedUrlFilter]);

  const updateRoute = (nextSearch: string, nextFilter: (typeof filters)[number]) => {
    const params = new URLSearchParams();

    if (urlFocus) {
      params.set("focus", urlFocus);
    }

    const trimmedSearch = nextSearch.trim();
    if (trimmedSearch) {
      params.set("search", trimmedSearch);
    }

    if (nextFilter !== "All") {
      params.set("filter", nextFilter.toLowerCase());
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const groupedTests = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const focusGroup = focusMap[urlFocus];

    return groups
      .map((group) => {
        const items = testsData.filter((item) => {
          const matchesFocusGroup = !focusGroup || item.group === focusGroup;
          const matchesGroup = item.group === group;
          const matchesFilter = filter === "All" || item.category === filter;
          const haystack = [item.name, ...(item.components ?? []), ...(item.searchAliases ?? [])].join(" ").toLowerCase();
          const matchesSearch =
            needle.length === 0 ||
            haystack.includes(needle) ||
            (needle === "sugar" &&
              ["hba1c", "fasting blood sugar", "post prandial blood sugar", "random blood sugar"].some((term) =>
                haystack.includes(term)
              ));

          return matchesFocusGroup && matchesGroup && matchesFilter && matchesSearch;
        });

        return { group, items };
      })
      .filter((section) => section.items.length > 0);
  }, [filter, search, urlFocus]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="individual-tests" className="bg-[#FFFFFF] min-h-screen pb-20 pt-8 sm:pt-12">
      <div className="section-wrap">
        {/* Header matching Option C */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD9C0] bg-[#FFF4E8] px-3.5 py-1 text-xs font-bold text-[#FF6B00]">
            <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>NABL Standard Laboratories · 1,000+ Tests</span>
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-[#0D0D0D] tracking-tight">
            Diagnostic Test Catalogue
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#626262] leading-relaxed">
            Real prices for individual blood tests, hormone markers, and organ profiles with complimentary doorstep home collection.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-8 rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 sm:p-4">
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8A8A]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateRoute(search, filter);
                  }
                }}
                placeholder="Search tests by name, biomarker, or condition..."
                className="w-full rounded-xl border border-[#EAEAEA] bg-white pl-10 pr-24 py-2.5 text-xs sm:text-sm font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => updateRoute(search, filter)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#0D0D0D] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#FF6B00]"
              >
                Search
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {filters.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setFilter(option);
                    updateRoute(search, option);
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    filter === option
                      ? "bg-[#FF6B00] text-white shadow-xs"
                      : "border border-[#EAEAEA] bg-white text-[#626262] hover:border-[#0D0D0D] hover:text-[#0D0D0D]"
                  }`}
                >
                  {option}
                </button>
              ))}

              <button
                type="button"
                onClick={openModal}
                className="rounded-xl border border-stone-800 bg-[#0D0D0D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#FF6B00] transition whitespace-nowrap flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto"
              >
                <Scale className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>Compare {selectedItems.length > 0 ? `(${selectedItems.length}/3)` : "Tests"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grouped Tests List */}
        <div className="mt-10 space-y-12">
          {groupedTests.map((section) => (
            <div key={section.group}>
              <div className="mb-4 flex items-baseline justify-between border-b border-[#EAEAEA] pb-3">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0D0D0D]">
                  {section.group}
                </h2>
                <span className="text-xs font-semibold text-[#626262]">
                  {section.items.length} tests available
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((test) => {
                  const isExpanded = !!expanded[test.id];

                  return (
                    <article
                      key={test.id}
                      className="group flex flex-col justify-between rounded-2xl border border-[#EAEAEA] bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-[#FF6B00]/60 hover:shadow-md"
                    >
                      <div>
                        {/* Header Tags */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-lg bg-[#FFF4E8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">
                            {test.category}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-[#626262]">
                            <Clock className="h-3 w-3" />
                            <span>{test.tat}</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="mt-3 text-lg font-bold text-[#0D0D0D] group-hover:text-[#FF6B00] transition-colors leading-snug">
                          {test.name}
                        </h3>

                        {test.fastingHours ? (
                          <p className="mt-1.5 text-xs text-[#626262] flex items-center gap-1">
                            <span className="font-semibold text-[#0D0D0D]">Fasting:</span> {test.fastingHours}
                          </p>
                        ) : null}

                        {/* Parameters Box */}
                        {test.components?.length ? (
                          <div className="mt-3 rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D0D0D]">
                                {test.components.length} Included Parameter(s)
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleExpanded(test.id)}
                                className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>{isExpanded ? "Hide" : "View"}</span>
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </button>
                            </div>

                            {isExpanded ? (
                              <ul className="mt-2.5 space-y-1 text-xs text-[#626262] max-h-36 overflow-y-auto">
                                {test.components.map((c) => (
                                  <li key={`${test.id}-${c}`}>• {c}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-1 text-xs text-[#626262] truncate">
                                {test.components.slice(0, 3).join(", ")}
                                {test.components.length > 3 ? "..." : ""}
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* Pricing & Booking Action */}
                      <div className="mt-5 pt-3.5 border-t border-[#EAEAEA] flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold text-[#8A8A8A]">Real Price</p>
                          <p className="text-xl font-black text-[#0D0D0D]">
                            ₹{formatPrice(test.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleItem(testToComparable(test))}
                            className={`rounded-xl border px-2.5 py-2 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              isItemComparing(test.id)
                                ? "border-[#FF6B00] bg-[#FFF4E8] text-[#FF6B00]"
                                : "border-[#EAEAEA] bg-[#F7F7F7] text-[#626262] hover:border-[#0D0D0D] hover:text-[#0D0D0D]"
                            }`}
                            title={isItemComparing(test.id) ? "Remove from comparison" : "Add to comparison"}
                          >
                            <Scale className="h-3 w-3" />
                            <span>{isItemComparing(test.id) ? "Comparing" : "Compare"}</span>
                          </button>
                          <Link
                            href={`/book-home-collection?test=${encodeURIComponent(test.name)}`}
                            className="cta-btn rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider"
                          >
                            Book
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {groupedTests.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-12 text-center">
            <p className="text-base font-bold text-[#0D0D0D]">No diagnostic tests found</p>
            <p className="mt-1 text-xs text-[#626262]">We could not find any tests matching &quot;{search}&quot;.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("All");
                updateRoute("", "All");
              }}
              className="mt-4 rounded-xl bg-[#0D0D0D] px-5 py-2 text-xs font-bold text-white hover:bg-[#FF6B00]"
            >
              Reset Filters
            </button>
          </div>
        ) : null}
        {/* Signature Carbon Black Diagnostic Guidance Card matching Option C Theme */}
        <div className="mt-16 overflow-hidden rounded-3xl border border-stone-800 bg-[#0D0D0D] p-8 sm:p-12 text-white relative shadow-xl">
          {/* Ambient warm orange glow in corner */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-[#FF6B00]/22 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/90 px-3.5 py-1 text-xs font-bold text-[#FF6B00]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>NABL Quality Standards · Expert Assistance</span>
              </span>
              <h3 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                Have a Doctor&apos;s Prescription or Need Test Guidance?
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
                Not sure which biomarker or lipid test you need? Our clinical diagnostic advisors help you choose the right individual tests or full-body preventive packages with real prices and zero fake discounts.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-300">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
                  <span>Free Doorstep Phlebotomy*</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
                  <span>Digital Reports in 12–24h</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
                  <span>NABL Lab Verified</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                href="/book-home-collection"
                className="cta-btn text-center justify-center cursor-pointer shadow-[0_8px_24px_rgba(255,107,0,0.35)]"
              >
                Book Home Collection
              </Link>
              <Link
                href="/packages"
                className="rounded-xl border border-stone-700 bg-stone-900/90 px-6 py-3 text-xs font-bold text-white hover:border-[#FF6B00] hover:bg-stone-800 transition text-center"
              >
                Explore Packages
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
