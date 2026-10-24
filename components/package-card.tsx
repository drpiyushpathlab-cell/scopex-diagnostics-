"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, CheckCircle2, ChevronRight, Zap, Scale } from "lucide-react";
import type { BadgeLabel, PackageItem } from "@/lib/data";
import { useCompare, packageToComparable } from "@/lib/compare-context";

const trustPoints = [
  "NABL Standard Partner Labs",
  "Pathologist-Reviewed Digital Reports",
  "Doorstep Sample Collection Included"
];

const badgeColors: Record<BadgeLabel, string> = {
  "Most Popular": "bg-[#FFF4EA] text-[#FF6B00] border border-[#fbd8b5]",
  "Start Here": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Best Value": "bg-blue-50 text-blue-700 border border-blue-200",
  Premium: "bg-amber-50 text-amber-800 border border-amber-200",
  Recommended: "bg-orange-50 text-orange-700 border border-orange-200",
  Advanced: "bg-purple-50 text-purple-700 border border-purple-200",
  Specialized: "bg-stone-100 text-stone-800 border border-stone-200",
  "Women Health": "bg-pink-50 text-pink-700 border border-pink-200",
  Confidential: "bg-slate-100 text-slate-700 border border-slate-200"
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function PackageCard({ item }: { item: PackageItem }) {
  const [showDetails, setShowDetails] = useState(false);
  const { toggleItem, isItemComparing } = useCompare();
  const isComparing = isItemComparing(item.id);
  const compactOverview = item.overview.slice(0, 8);
  const visibleOverview = showDetails ? item.overview : compactOverview;
  const hasMoreDetails = item.overview.length > compactOverview.length;

  return (
    <article
      id={item.id}
      className={[
        "group relative flex min-h-[740px] h-full flex-col justify-between overflow-hidden rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        item.featured
          ? "border-[#FF6B00] shadow-[0_12px_36px_rgba(255,107,0,0.12)] ring-1 ring-[#FF6B00]"
          : "border-[#EAEAEA] shadow-xs"
      ].join(" ")}
    >
      {/* Top Badge & Tier */}
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-lg bg-[#FFF4E8] px-2.5 py-1 text-xs font-bold text-[#FF6B00]">
          {item.badge}
        </span>
        <span className="text-xs font-semibold text-[#626262]">
          {item.overview.length} Tests Included
        </span>
      </div>

      {/* Title & Tagline */}
      <h3 className="mt-4 text-2xl font-extrabold text-[#0D0D0D] tracking-tight">{item.name}</h3>
      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#626262]">{item.tagline}</p>

      {/* Pricing Block */}
      <div className="mt-5 flex items-baseline gap-2 border-y border-[#EAEAEA] py-4">
        <span className="text-3xl font-black text-[#0D0D0D] tabular-nums sm:text-4xl">
          ₹{formatCurrency(item.price)}
        </span>
        <span className="text-xs text-[#8A8A8A]">/ verified price</span>
      </div>

      {/* Tests Overview */}
      <div className="mt-4 flex-1 rounded-xl bg-[#F7F7F7] p-4 border border-[#EAEAEA]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">Key Parameters</p>
          <span className="text-[11px] font-medium text-[#626262]">{item.overview.length} markers</span>
        </div>
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-[#4A4A4A] sm:grid-cols-2">
          {visibleOverview.map((test) => (
            <li key={`${item.id}-${test}`} className="flex items-center gap-1.5 truncate" title={test}>
              <Check className="h-3 w-3 shrink-0 text-[#FF6B00]" />
              <span className="truncate">{test}</span>
            </li>
          ))}
        </ul>
        {hasMoreDetails && (
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#FF6B00] hover:underline"
          >
            <span>{showDetails ? "Show Less" : `+${item.overview.length - compactOverview.length} More Parameters`}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Why This Package */}
      <div className="mt-4 rounded-xl border border-[#EAEAEA] bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">Why Choose This</p>
        <ul className="mt-2.5 space-y-2 text-xs leading-5 text-[#626262]">
          {item.whyPackage.map((point) => (
            <li key={`${item.id}-${point}`} className="flex items-start gap-2">
              <Zap className="h-3.5 w-3.5 shrink-0 text-[#FF6B00] mt-0.5" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Trust Points */}
      <div className="mt-4 space-y-1.5 border-t border-[#EAEAEA] pt-3 text-xs text-[#626262]">
        {trustPoints.map((point) => (
          <div key={point} className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{point}</span>
          </div>
        ))}
      </div>

      {/* Action */}
      <div className="mt-6 pt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => toggleItem(packageToComparable(item))}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-3.5 text-xs font-bold transition cursor-pointer ${
            isComparing
              ? "border-[#FF6B00] bg-[#FFF4E8] text-[#FF6B00]"
              : "border-[#EAEAEA] bg-[#F7F7F7] text-[#4A4A4A] hover:border-[#0D0D0D] hover:text-[#0D0D0D]"
          }`}
          title={isComparing ? "Remove from comparison" : "Compare this package"}
        >
          <Scale className="h-4 w-4" />
          <span>{isComparing ? "Comparing" : "Compare"}</span>
        </button>
        <Link
          href={`/book-home-collection?package=${encodeURIComponent(item.name)}`}
          className="cta-btn flex-1 rounded-xl py-3.5 text-xs font-bold tracking-wider text-center justify-center"
        >
          Book Now
        </Link>
      </div>
    </article>
  );
}
