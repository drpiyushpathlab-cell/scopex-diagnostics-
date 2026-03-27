"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { testsData } from "@/lib/data";

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
          const haystack = [item.name, ...(item.components ?? [])].join(" ").toLowerCase();
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
    <section id="individual-tests" className="premium-section relative overflow-hidden pb-28 pt-10 md:pb-14 md:pt-12 scroll-mt-32">
      <div className="section-wrap relative z-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF6A00]">Targeted Diagnostics</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">Individual Tests</h1>
          <p className="premium-muted mt-4 text-base leading-7 md:text-lg">Choose specific tests based on your needs</p>
        </div>

        <div className="premium-panel mt-8 rounded-[24px] p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1.8fr_1fr]">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tests or components"
                className="premium-input rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#FF6A00]"
              />
              <button
                type="button"
                onClick={() => {
                  const nextSearch = search.trim();
                  setSearch(nextSearch);
                  updateRoute(nextSearch, filter);
                }}
                className="secondary-btn whitespace-nowrap px-4 py-3 text-[11px] sm:min-w-[108px]"
              >
                Search
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setFilter(option);
                    updateRoute(search, option);
                  }}
                  className={[
                    "rounded-full px-4 py-3 text-sm font-semibold transition",
                    filter === option ? "bg-[#FF6A00] text-white shadow-[0_0_22px_rgba(255,106,0,0.28)]" : "premium-chip hover:border-[#FF6A00]/50"
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {groupedTests.map((section) => (
            <section key={section.group}>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold md:text-[2rem]">{section.group}</h2>
                  <p className="premium-subtle mt-1 text-sm">{section.items.length} tests available</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.items.map((test) => {
                  const isExpanded = !!expanded[test.id];

                  return (
                    <article
                      key={test.id}
                      className="premium-card flex h-full flex-col rounded-[24px] p-5 transition duration-300 hover:scale-[1.03] hover:shadow-[0_22px_60px_rgba(0,0,0,0.42)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FF6A00]">{test.category}</p>
                          <h3 className="mt-2 text-xl font-bold leading-tight">{test.name}</h3>
                        </div>
                        <div className="shrink-0 pl-2 text-right">
                          <p className="text-[1.9rem] font-bold leading-none text-[#FF6A00]">{"\u20B9"}{formatPrice(test.price)}</p>
                          {test.mrp ? <p className="premium-subtle mt-1 text-xs line-through">MRP {"\u20B9"}{formatPrice(test.mrp)}</p> : null}
                          {test.discount ? <p className="mt-1 text-xs font-semibold text-[#FF6A00]">{test.discount}% OFF</p> : null}
                        </div>
                      </div>

                      {test.fastingHours ? <p className="mt-3 text-[12px] text-[#A3A3A3]">{"\u23F1"} {test.fastingHours}</p> : null}

                      {test.components?.length ? (
                        <div className="premium-card-soft mt-4 rounded-2xl p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="premium-subtle text-xs font-semibold uppercase tracking-[0.14em]">Components</p>
                            <button type="button" onClick={() => toggleExpanded(test.id)} className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FF6A00]">
                              {isExpanded ? "Collapse" : "Expand"}
                            </button>
                          </div>
                          {isExpanded ? (
                            <ul className="mt-3 grid gap-2 text-sm leading-6">
                              {test.components.map((component) => (
                                <li key={`${test.id}-${component}`}>{component}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="premium-muted mt-3 text-sm leading-6">
                              {test.components.slice(0, 3).join(", ")}
                              {test.components.length > 3 ? "..." : ""}
                            </p>
                          )}
                        </div>
                      ) : null}

                      <div className="mt-5">
                        <Link href={`/book-home-collection?test=${encodeURIComponent(test.name)}`} className="cta-btn w-full justify-center text-center">
                          Book Test
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {groupedTests.length === 0 ? (
          <div className="premium-panel mt-8 rounded-[24px] p-8 text-center premium-muted">
            No tests found for the current search or filter.
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-4 bottom-24 z-30 md:hidden">
        <Link href="/book-home-collection" className="cta-btn w-full justify-center text-center">
          Book Test
        </Link>
      </div>
    </section>
  );
}
