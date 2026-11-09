"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { testsData, type TestItem } from "@/lib/data";
import { calculateCustomPackagePricing } from "@/lib/pricing";
import {
  Search,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  Sparkles,
  Droplet,
  Clock,
  ArrowRight,
  Info,
  CheckCircle2
} from "lucide-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN").format(Math.max(0, Math.round(value)));
}

export function CustomPackageBuilder({ initialSelectedIds = [] }: { initialSelectedIds?: string[] }) {
  const router = useRouter();
  const [tests, setTests] = useState<TestItem[]>(testsData);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    async function loadFreshTests() {
      try {
        const res = await fetch("/api/backend/tests");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tests) && data.tests.length > 0) {
            setTests(data.tests);
          }
        }
      } catch {
        // Fallback to imported testsData
      }
    }
    void loadFreshTests();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    tests.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return ["All", ...Array.from(set)];
  }, [tests]);

  const filteredTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tests.filter((t) => {
      if (t.isActive === false) return false;
      if (selectedCategory !== "All" && t.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.group.toLowerCase().includes(q) ||
        (t.components || []).some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [tests, searchQuery, selectedCategory]);

  const selectedTests = useMemo(() => {
    return selectedIds
      .map((id) => tests.find((t) => t.id === id))
      .filter((t): t is TestItem => Boolean(t));
  }, [selectedIds, tests]);

  // Recalculate prices and eligible bundle discounts dynamically enforcing each test's discount cap
  const pricing = useMemo(() => {
    return calculateCustomPackagePricing(
      selectedTests.map((t) => ({
        id: t.id,
        name: t.name,
        price: t.price,
        mrp: t.mrp || Math.round(t.price * 1.5),
        discountCapPercent: t.discountCapPercent ?? 20
      }))
    );
  }, [selectedTests]);

  function toggleTest(testId: string) {
    setSelectedIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  }

  function removeTest(testId: string) {
    setSelectedIds((prev) => prev.filter((id) => id !== testId));
  }

  function clearAll() {
    setSelectedIds([]);
  }

  const freeCollectionThreshold = 600;
  const isFreeCollection = pricing.payableAmount >= freeCollectionThreshold || selectedTests.length === 0;
  const collectionFee = isFreeCollection ? 0 : 99;
  const totalPayable = pricing.payableAmount > 0 ? pricing.payableAmount + collectionFee : 0;
  const totalGrossSavings = pricing.referenceTotal > 0 ? pricing.referenceTotal - pricing.payableAmount : 0;

  function proceedToCheckout() {
    if (!selectedIds.length) return;
    const testParam = selectedIds.join(",");
    router.push(`/book-home-collection?customTests=${encodeURIComponent(testParam)}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] items-start">
      {/* Left Column: Test Search & Selection */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#EAEAEA] bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#0D0D0D]">Select Individual Tests</h2>
              <p className="mt-1 text-xs sm:text-sm text-[#626262]">
                Choose diagnostic tests to create your custom panel. Bundle discounts apply automatically up to 20%.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#FF6B00] bg-[#FFF4E8] px-3 py-1 rounded-full self-start sm:self-auto shrink-0">
              {filteredTests.length} tests available
            </span>
          </div>

          {/* Search bar */}
          <div className="mt-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests by name, biomarker, or organ (e.g. CBC, Lipid, Thyroid, Liver)..."
              className="w-full rounded-xl border border-[#EAEAEA] bg-[#FBFBFB] pl-10 pr-4 py-2.5 text-sm text-[#0D0D0D] placeholder-stone-400 outline-none transition focus:border-[#FF6B00] focus:bg-white"
            />
          </div>

          {/* Category Filter Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#0D0D0D] text-white shadow-xs"
                    : "bg-[#F7F7F7] text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Test List Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredTests.map((test) => {
            const isSelected = selectedIds.includes(test.id);
            const mrp = test.mrp || Math.round(test.price * 1.5);
            const cap = test.discountCapPercent ?? 20;

            return (
              <article
                key={test.id}
                onClick={() => toggleTest(test.id)}
                className={`relative flex flex-col justify-between rounded-xl border p-4 transition cursor-pointer ${
                  isSelected
                    ? "border-[#FF6B00] bg-[#FFF8F2] shadow-sm ring-1 ring-[#FF6B00]"
                    : "border-[#EAEAEA] bg-white hover:border-stone-300 hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold text-stone-500">{test.category}</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      Max {cap}% discount cap
                    </span>
                  </div>

                  <h3 className="mt-1 text-base font-bold text-[#0D0D0D] leading-snug">{test.name}</h3>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#626262]">
                    <span className="flex items-center gap-1">
                      <Droplet className="h-3 w-3 text-[#FF6B00]" />
                      {test.specimenType || "Blood Serum"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-stone-400" />
                      {test.tat || "12-24 Hrs"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#EAEAEA] pt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-[#0D0D0D] tabular-nums">₹{formatCurrency(test.price)}</span>
                    {mrp > test.price && (
                      <span className="text-xs text-stone-400 line-through tabular-nums">₹{formatCurrency(mrp)}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTest(test.id);
                    }}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      isSelected
                        ? "bg-[#FF6B00] text-white"
                        : "bg-[#F7F7F7] text-stone-700 hover:bg-[#FF6B00] hover:text-white"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}

          {filteredTests.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-stone-200 p-8 text-center bg-white">
              <p className="text-sm font-semibold text-stone-600">No diagnostic tests found matching &quot;{searchQuery}&quot;</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-3 text-xs font-bold text-[#FF6B00] hover:underline"
              >
                Reset search and filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Dynamic Pricing Engine & Custom Package Cart */}
      <div className="sticky top-20 space-y-4">
        <div className="rounded-2xl border border-[#EAEAEA] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B00]">Type 2: Custom Package</span>
              <h3 className="text-lg font-extrabold text-[#0D0D0D]">Live Package Summary</h3>
            </div>
            {selectedTests.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Bundle Progress Indicator */}
          <div className="mt-4 rounded-xl bg-[#FFF8F2] border border-[#FFD9C0] p-3 text-xs">
            <div className="flex items-center justify-between font-bold text-[#0D0D0D]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
                Bundle Savings Tier
              </span>
              <span className="text-[#FF6B00] font-black">{pricing.bundlePercentage}% Tier</span>
            </div>
            <p className="mt-1 text-[11px] text-[#626262]">
              {selectedTests.length === 0 && "Select tests to unlock automatic bundle discounts."}
              {selectedTests.length === 1 && "Add 1 more test to unlock 10% bundle savings!"}
              {selectedTests.length === 2 && "10% bundle rate applied. Add 1 more test for 15%!"}
              {selectedTests.length === 3 && "15% bundle rate applied. Add 1 more test for 20% max!"}
              {selectedTests.length >= 4 && "20% maximum bundle savings rate unlocked!"}
            </p>
          </div>

          {/* Selected Tests List */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#0D0D0D]">
              <span>Selected Tests ({selectedTests.length})</span>
              <span className="text-[11px] text-stone-500">Individual Caps Enforced</span>
            </div>

            {selectedTests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-xs text-stone-500 bg-[#FAFAFA]">
                No tests added yet. Click &quot;Add&quot; on any test from the left to begin building your custom package.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {pricing.testBreakdown.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-[#EAEAEA] bg-[#FBFBFB] p-2.5 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-[#0D0D0D] truncate" title={item.name}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                        <span>₹{formatCurrency(item.price)}</span>
                        <span>·</span>
                        <span className="text-amber-800 font-medium">Cap: {item.discountCapPercent}%</span>
                        {item.appliedRate > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-700 font-semibold">
                              Saved ₹{formatCurrency(item.discountAmount)} ({item.appliedRate}%)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTest(item.id)}
                      className="text-stone-400 hover:text-rose-600 transition p-1"
                      title="Remove test"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recalculated Financial Breakdown */}
          <div className="mt-5 space-y-2 border-t border-[#EAEAEA] pt-4 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Reference Market MRP</span>
              <span className="line-through tabular-nums">₹{formatCurrency(pricing.referenceTotal)}</span>
            </div>
            <div className="flex justify-between text-stone-700 font-semibold">
              <span>Tests Real Subtotal</span>
              <span className="tabular-nums">₹{formatCurrency(pricing.subtotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Eligible Bundle Savings</span>
              <span className="tabular-nums">-₹{formatCurrency(pricing.bundleDiscount)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Doorstep Sample Collection</span>
              <span className="tabular-nums font-semibold">
                {isFreeCollection ? (
                  <span className="text-emerald-700">FREE</span>
                ) : (
                  "₹99"
                )}
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between border-t border-[#EAEAEA] pt-3 text-sm">
              <span className="font-extrabold text-[#0D0D0D]">Final Payable</span>
              <div className="text-right">
                <span className="text-2xl font-black text-[#0D0D0D] tabular-nums">
                  ₹{formatCurrency(totalPayable)}
                </span>
                <p className="text-[10px] text-stone-400">All taxes included</p>
              </div>
            </div>

            {totalGrossSavings > 0 && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-center text-xs font-bold text-emerald-800">
                You save ₹{formatCurrency(totalGrossSavings)} ({pricing.savingsPercent}% total savings)
              </div>
            )}
          </div>

          {/* Action CTA */}
          <div className="mt-5">
            <button
              type="button"
              disabled={selectedTests.length === 0}
              onClick={proceedToCheckout}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider transition ${
                selectedTests.length > 0
                  ? "bg-[#FF6B00] text-white hover:bg-[#E56000] shadow-md cursor-pointer"
                  : "bg-stone-200 text-stone-400 cursor-not-allowed"
              }`}
            >
              <span>Book Custom Package ({selectedTests.length} Tests)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-stone-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>NABL certified lab processing & transparent pricing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
