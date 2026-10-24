"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  X,
  Plus,
  Check,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  Scale,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useCompare, testToComparable, packageToComparable } from "@/lib/compare-context";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-IN").format(val);
}

export function CompareModal() {
  const {
    selectedItems,
    removeItem,
    clearAll,
    isModalOpen,
    closeModal,
    availableTests,
    availablePackages,
    addItem
  } = useCompare();

  const [markerSearch, setMarkerSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  // Filter for adding more items inside the modal
  const addableItems = useMemo(() => {
    const query = addSearch.trim().toLowerCase();
    const existingIds = new Set(selectedItems.map((i) => i.id));

    const testOptions = availableTests
      .map(testToComparable)
      .filter((item) => !existingIds.has(item.id));

    const packageOptions = availablePackages
      .map(packageToComparable)
      .filter((item) => !existingIds.has(item.id));

    const combined = [...packageOptions, ...testOptions];
    if (!query) return combined.slice(0, 8);

    return combined
      .filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.markers.some((m) => m.toLowerCase().includes(query))
      )
      .slice(0, 10);
  }, [availableTests, availablePackages, selectedItems, addSearch]);

  if (!isModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border border-[#EAEAEA] bg-white shadow-2xl overflow-hidden my-auto">
        {/* Header with Carbon Black styling */}
        <div className="relative overflow-hidden bg-[#0D0D0D] p-5 sm:p-6 text-white border-b border-stone-800 shrink-0">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#FF6B00]/22 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/90 px-3 py-0.5 text-xs font-semibold text-[#FF6B00]">
                <Scale className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>Side-by-Side Diagnostic Evaluation</span>
                <span className="text-stone-400">·</span>
                <span className="text-white font-bold">{selectedItems.length} of 3 Selected</span>
              </div>
              <h2 id="compare-modal-title" className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">
                Compare Tests &amp; Health Packages
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-stone-300">
                Compare clinical biomarkers, preparation fasting requirements, verified pricing, and report delivery side-by-side.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-xl border border-stone-700 bg-stone-900/80 px-3 py-1.5 text-xs font-semibold text-stone-300 hover:text-white hover:border-red-500/50 hover:bg-stone-800 transition cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-stone-700 bg-stone-900/90 p-2 text-stone-300 hover:text-white hover:bg-stone-800 transition cursor-pointer"
                aria-label="Close Comparison"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {selectedItems.length === 0 ? (
            <div className="py-12 text-center max-w-lg mx-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4E8] text-[#FF6B00]">
                <Scale className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-[#0D0D0D]">No Items in Comparison</h3>
              <p className="mt-1 text-xs sm:text-sm text-[#626262] leading-relaxed">
                Select up to 3 individual diagnostic tests or comprehensive health packages from our catalog to compare parameters, fasting rules, and bundle pricing.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/packages"
                  onClick={closeModal}
                  className="cta-btn text-xs font-bold py-2.5 px-4"
                >
                  Browse Packages
                </Link>
                <Link
                  href="/tests"
                  onClick={closeModal}
                  className="rounded-xl border border-[#0D0D0D] bg-white px-4 py-2.5 text-xs font-bold text-[#0D0D0D] hover:bg-[#F7F7F7]"
                >
                  Browse Tests
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Optional Marker Search Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F7F7] p-3 rounded-2xl border border-[#EAEAEA]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                  <Sparkles className="h-4 w-4 text-[#FF6B00]" />
                  <span>Highlight Specific Biomarker:</span>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8A8A]" />
                  <input
                    type="text"
                    value={markerSearch}
                    onChange={(e) => setMarkerSearch(e.target.value)}
                    placeholder="e.g. CBC, Sugar, Lipid, TSH..."
                    className="w-full rounded-xl border border-[#EAEAEA] bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:outline-none"
                  />
                  {markerSearch && (
                    <button
                      type="button"
                      onClick={() => setMarkerSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Side-by-Side Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {selectedItems.map((item) => {
                  const savings = item.mrp > item.price ? item.mrp - item.price : 0;
                  const pricePerMarker = item.markers.length > 0 ? Math.round(item.price / item.markers.length) : item.price;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-2xl border border-[#EAEAEA] bg-white p-5 shadow-xs hover:border-[#FF6B00]/40 transition relative"
                    >
                      {/* Top Type Pill & Remove */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.type === "package"
                              ? "bg-[#FFF4E8] text-[#FF6B00] border border-[#FFD9C0]"
                              : "bg-stone-100 text-[#0D0D0D] border border-stone-200"
                          }`}
                        >
                          {item.type === "package" ? "Health Package" : "Individual Test"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded-lg p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                          title="Remove from comparison"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Title & Badge */}
                      <div className="mt-3">
                        <h3 className="text-xl font-black text-[#0D0D0D] tracking-tight leading-snug">
                          {item.name}
                        </h3>
                        {item.badge && (
                          <p className="mt-1 text-xs font-semibold text-[#FF6B00]">
                            {item.badge} · {item.category}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-[#626262] line-clamp-2">
                          {item.tagline}
                        </p>
                      </div>

                      {/* Pricing Block */}
                      <div className="mt-4 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] p-3.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <div>
                            <span className="text-2xl font-black text-[#0D0D0D]">
                              ₹{formatCurrency(item.price)}
                            </span>
                            {item.mrp > item.price && (
                              <span className="ml-2 text-xs text-[#8A8A8A] line-through">
                                ₹{formatCurrency(item.mrp)}
                              </span>
                            )}
                          </div>
                          {item.discount > 0 && (
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                              {item.discount}% OFF
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-[#626262] border-t border-[#EAEAEA] pt-2">
                          <span>{savings > 0 ? `You Save ₹${formatCurrency(savings)}` : "Verified Transparent Price"}</span>
                          <span className="font-semibold text-[#0D0D0D]">₹{pricePerMarker}/marker</span>
                        </div>
                      </div>

                      {/* Fasting, Sample & Turnaround Details */}
                      <div className="mt-4 space-y-2 border-y border-[#EAEAEA] py-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 font-medium">Fasting:</span>
                          <span className="font-bold text-[#0D0D0D] text-right truncate ml-2">
                            {item.fastingHours}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 font-medium">Sample Specimen:</span>
                          <span className="font-semibold text-[#0D0D0D] text-right truncate ml-2">
                            {item.sampleType}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 font-medium">Report Delivery:</span>
                          <span className="font-semibold text-emerald-700 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.tat}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 font-medium">Home Collection:</span>
                          <span className="font-bold text-[#FF6B00]">Complimentary</span>
                        </div>
                      </div>

                      {/* Markers & Parameters List */}
                      <div className="mt-4 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D]">
                            Included Parameters ({item.markers.length})
                          </span>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-2.5 text-xs text-[#4A4A4A]">
                          {item.markers.map((marker) => {
                            const isMatched =
                              markerSearch.trim().length > 0 &&
                              marker.toLowerCase().includes(markerSearch.trim().toLowerCase());

                            return (
                              <div
                                key={`${item.id}-${marker}`}
                                className={`flex items-start gap-1.5 p-1 rounded-md transition ${
                                  isMatched ? "bg-amber-100 font-bold text-amber-900 ring-1 ring-amber-300" : ""
                                }`}
                              >
                                <Check className="h-3.5 w-3.5 text-[#FF6B00] shrink-0 mt-0.5" />
                                <span className="leading-snug">{marker}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Best For / Why Choose */}
                      <div className="mt-4 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] p-3 text-xs">
                        <span className="font-bold text-[#0D0D0D] block mb-1">Recommended For:</span>
                        <p className="text-[#626262] leading-relaxed">
                          {item.bestFor.join(", ")}
                        </p>
                      </div>

                      {/* Action CTA */}
                      <div className="mt-5 pt-3 border-t border-[#EAEAEA]">
                        <Link
                          href={item.bookUrl}
                          onClick={closeModal}
                          className="cta-btn w-full text-center justify-center py-3 text-xs font-bold"
                        >
                          Book Home Collection
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Empty Slot to Add More (up to 3 items) */}
                {selectedItems.length < 3 && (
                  <div className="flex flex-col justify-center items-center rounded-2xl border-2 border-dashed border-[#D5D5D5] bg-[#FBFBFB] p-6 text-center min-h-[460px]">
                    <div className="h-12 w-12 rounded-full bg-white border border-[#EAEAEA] flex items-center justify-center text-[#FF6B00] shadow-xs mb-3">
                      <Plus className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-bold text-[#0D0D0D]">
                      Add Another to Compare
                    </h4>
                    <p className="mt-1 text-xs text-[#626262] max-w-xs">
                      Compare up to 3 individual blood tests or preventive packages side-by-side.
                    </p>

                    <div className="mt-4 w-full max-w-xs relative text-left">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8A8A]" />
                        <input
                          type="text"
                          value={addSearch}
                          onChange={(e) => {
                            setAddSearch(e.target.value);
                            setShowAddDropdown(true);
                          }}
                          onFocus={() => setShowAddDropdown(true)}
                          placeholder="Search tests or packages..."
                          className="w-full rounded-xl border border-[#EAEAEA] bg-white pl-8 pr-3 py-2 text-xs font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:outline-none shadow-xs"
                        />
                      </div>

                      {showAddDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-y-auto rounded-xl border border-[#EAEAEA] bg-white shadow-xl z-20 p-1.5 space-y-1">
                          {addableItems.length === 0 ? (
                            <p className="p-3 text-xs text-[#8A8A8A] text-center">
                              No matching tests or packages found.
                            </p>
                          ) : (
                            addableItems.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  addItem(item);
                                  setAddSearch("");
                                  setShowAddDropdown(false);
                                }}
                                className="w-full text-left p-2 rounded-lg hover:bg-[#FFF4E8] transition flex items-center justify-between group cursor-pointer"
                              >
                                <div className="truncate mr-2">
                                  <p className="text-xs font-bold text-[#0D0D0D] group-hover:text-[#FF6B00] truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-[10px] text-[#626262]">
                                    {item.type === "package" ? "Health Package" : "Individual Test"} · {item.markers.length} markers
                                  </p>
                                </div>
                                <span className="text-xs font-black text-[#0D0D0D] shrink-0">
                                  ₹{formatCurrency(item.price)}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <Link
                        href="/packages"
                        onClick={closeModal}
                        className="text-xs font-bold text-[#FF6B00] hover:underline"
                      >
                        Browse Packages →
                      </Link>
                      <span className="text-stone-300">·</span>
                      <Link
                        href="/tests"
                        onClick={closeModal}
                        className="text-xs font-bold text-[#0D0D0D] hover:underline"
                      >
                        Browse Tests →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#EAEAEA] bg-[#F7F7F7] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#626262] shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#FF6B00]" />
            <span>NABL Reference Standard Laboratories · 100% Sterile Single-Use Collection Kits</span>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-xl border border-stone-300 bg-white px-5 py-2 text-xs font-bold text-[#0D0D0D] hover:bg-stone-100 transition cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
