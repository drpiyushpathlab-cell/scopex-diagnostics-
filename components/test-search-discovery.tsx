"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  Search,
  Droplet,
  Heart,
  Activity,
  Sun,
  Shield,
  Clock,
  ArrowRight,
  UserCheck,
  CheckCircle2
} from "lucide-react";
import { testsData } from "@/lib/data";

const quickCards = [
  {
    label: "Full Body Checkup",
    href: "/packages",
    query: "full body",
    bg: "bg-[#FFF8F2]",
    iconColor: "text-[#FF6B00]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21v-3.5a3.5 3.5 0 0 1 7 0V21" />
        <path d="M11.5 21v-3.5a3.5 3.5 0 0 1 7 0V21" />
      </svg>
    )
  },
  {
    label: "CBC",
    href: "/tests?focus=basic-tests&search=cbc",
    query: "cbc",
    bg: "bg-[#F7F9FB]",
    iconColor: "text-[#FF6B00]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <circle cx="6" cy="8" r="2" />
        <circle cx="18" cy="8" r="2" />
        <circle cx="6" cy="16" r="2" />
        <circle cx="18" cy="16" r="2" />
      </svg>
    )
  },
  {
    label: "Thyroid (TSH)",
    href: "/tests?focus=profile-tests&search=thyroid",
    query: "thyroid",
    bg: "bg-[#FFF9F5]",
    iconColor: "text-[#FF6B00]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 4c-3 0-5 2.5-5 5.5 0 2.5 1.5 4.5 3 6.5l2 2 2-2c1.5-2 3-4 3-6.5C17 6.5 15 4 12 4Z" />
        <path d="M12 9v5" />
      </svg>
    )
  },
  {
    label: "Vitamin D",
    href: "/tests?search=vitamin%20d",
    query: "vitamin d",
    bg: "bg-[#FFFDF4]",
    iconColor: "text-[#FF6B00]",
    icon: <Sun className="h-6 w-6 text-[#FF6B00]" />
  },
  {
    label: "Liver Function",
    href: "/tests?focus=organ-function-tests&search=liver",
    query: "liver",
    bg: "bg-[#FFF8F5]",
    iconColor: "text-[#FF6B00]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 8c2-3 8-4 12-2s5 7 3 11-8 4-12 2-5-7-3-11Z" />
      </svg>
    )
  },
  {
    label: "Diabetes (HbA1c)",
    href: "/tests?focus=basic-tests&search=hba1c",
    query: "hba1c",
    bg: "bg-[#FFF4E8]",
    iconColor: "text-[#FF6B00]",
    icon: <Droplet className="h-6 w-6 text-[#FF6B00]" />
  }
];

export function TestSearchDiscovery() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "packages" | "fullbody">("search");

  const filteredTests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return testsData
      .filter((t) => {
        const nameMatch = t.name.toLowerCase().includes(term);
        const aliasMatch = t.searchAliases?.some((a) => a.toLowerCase().includes(term));
        const componentMatch = t.components?.some((c) => c.toLowerCase().includes(term));
        const groupMatch = t.group.toLowerCase().includes(term);
        return nameMatch || aliasMatch || componentMatch || groupMatch;
      })
      .slice(0, 6);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      router.push(`/tests?search=${encodeURIComponent(query)}`);
    } else {
      router.push("/tests");
    }
  };

  return (
    <section className="relative z-20 -mt-6 sm:-mt-8 pb-10 sm:pb-14">
      <div className="section-wrap">
        {/* Main Floating Option C Card */}
        <div className="rounded-3xl border border-[#EAEAEA] bg-white p-5 sm:p-7 shadow-[0_16px_45px_rgba(13,13,13,0.08)]">
          {/* Top Segmented Navigation Tabs */}
          <div className="flex items-center justify-between rounded-2xl bg-[#F7F7F7] p-1.5 max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition text-center cursor-pointer ${
                activeTab === "search"
                  ? "bg-[#0D0D0D] text-white shadow-xs"
                  : "text-[#626262] hover:text-[#0D0D0D]"
              }`}
            >
              Search Tests
            </button>
            <Link
              href="/packages"
              onClick={() => setActiveTab("packages")}
              className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition text-center cursor-pointer ${
                activeTab === "packages"
                  ? "bg-[#0D0D0D] text-white shadow-xs"
                  : "text-[#626262] hover:text-[#0D0D0D]"
              }`}
            >
              Popular Packages
            </Link>
            <Link
              href="/packages/health-360-pro"
              onClick={() => setActiveTab("fullbody")}
              className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition text-center cursor-pointer ${
                activeTab === "fullbody"
                  ? "bg-[#0D0D0D] text-white shadow-xs"
                  : "text-[#626262] hover:text-[#0D0D0D]"
              }`}
            >
              Full Body Checkup
            </Link>
          </div>

          {/* Search Input Bar with Orange Button */}
          <div className="mt-6 max-w-3xl mx-auto relative">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center rounded-2xl border-2 border-[#EAEAEA] bg-white p-1.5 shadow-sm transition focus-within:border-[#FF6B00]"
            >
              <div className="flex items-center pl-3.5 text-[#626262] shrink-0">
                <Search className="h-5 w-5 text-[#8A8A8A]" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tests (e.g. CBC, Vitamin D, HbA1c...)"
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:outline-none"
              />
              <button
                type="submit"
                className="cta-btn shrink-0 flex items-center gap-1.5 rounded-xl px-5 sm:px-7 py-2.5 sm:py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-none"
              >
                <span>Search</span>
                <Search className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </form>

            {/* Live Suggestions Dropdown */}
            {searchTerm.trim().length > 1 && (
              <div className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl border border-[#EAEAEA] bg-white p-3 shadow-2xl max-h-72 overflow-y-auto">
                <div className="px-2 py-1 text-[11px] font-bold text-[#626262] uppercase tracking-wider">
                  Direct Matches ({filteredTests.length})
                </div>
                {filteredTests.length > 0 ? (
                  <div className="divide-y divide-[#EAEAEA]">
                    {filteredTests.map((test) => (
                      <Link
                        key={test.id}
                        href={`/book-home-collection?test=${encodeURIComponent(test.name)}`}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FFF4E8] transition group"
                      >
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-[#0D0D0D] group-hover:text-[#FF6B00]">
                            {test.name}
                          </p>
                          <p className="text-[10px] text-[#626262]">
                            {test.group} · {test.tat}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs sm:text-sm font-black text-[#0D0D0D]">
                            ₹{test.price}
                          </span>
                          <span className="text-[11px] font-bold text-[#FF6B00] group-hover:underline">
                            Book Now →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-5 text-center">
                    <p className="text-xs text-[#626262]">No exact match for &quot;{searchTerm}&quot;</p>
                    <Link
                      href={`/tests?search=${encodeURIComponent(searchTerm)}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] hover:underline"
                    >
                      <span>Search catalog for &quot;{searchTerm}&quot;</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 6 Quick Test Icon Cards Grid (Matching Option C) */}
          <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className={`group flex flex-col items-center justify-center rounded-2xl border border-[#EAEAEA] p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:border-[#FF6B00] hover:shadow-md cursor-pointer ${card.bg}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs transition group-hover:scale-110 ${card.iconColor}`}>
                  {card.icon}
                </div>
                <span className="mt-3 text-xs font-bold text-[#0D0D0D] group-hover:text-[#FF6B00] transition-colors leading-tight">
                  {card.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
