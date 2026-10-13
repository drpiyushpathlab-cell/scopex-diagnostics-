"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import type { BadgeLabel, PackageItem } from "@/lib/data";

const trustPoints = [
  "NABL Standard Partner Labs",
  "Pathologist-Reviewed Digital Reports",
  "Doorstep Sample Collection Included"
];

const badgeColors: Record<BadgeLabel, string> = {
  "Most Popular": "bg-[#FFF4EA] text-[#F7931E] border border-[#fbd8b5]",
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
  const compactOverview = item.overview.slice(0, 8);
  const visibleOverview = showDetails ? item.overview : compactOverview;
  const hasMoreDetails = item.overview.length > compactOverview.length;

  return (
    <article
      id={item.id}
      className={[
        "group relative flex min-h-[780px] h-full flex-col overflow-hidden rounded-3xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(13,13,13,0.08)]",
        item.featured
          ? "border-[#F7931E] shadow-[0_16px_40px_rgba(247,147,30,0.12)]"
          : "border-[#E8E2DC] shadow-[0_12px_30px_rgba(13,13,13,0.03)]"
      ].join(" ")}
    >
      {/* Top Badge & Tier */}
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${badgeColors[item.badge] ?? "bg-slate-100 text-slate-700"}`}>
          {item.badge}
        </span>
        <span className="text-[11px] font-semibold tracking-wider text-[#F7931E]">
          {item.overview.length} Tests Included
        </span>
      </div>

      {/* Title & Tagline */}
      <h3 className="mt-4 text-2xl font-extrabold text-[#0D0D0D] tracking-tight">{item.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#5f6868]">{item.tagline}</p>

      {/* Pricing Block */}
      <div className="mt-6 flex items-baseline gap-2 border-y border-[#F3ECE6] py-4">
        <span className="text-3xl font-extrabold text-[#0D0D0D] tabular-nums sm:text-4xl">
          ₹{formatCurrency(item.price)}
        </span>
        <span className="text-xs text-[#8A8A8A]">/ transparent price</span>
      </div>

      {/* Tests Overview */}
      <div className="mt-5 flex-1 rounded-2xl bg-[#FBF8F5] p-4 border border-[#F0EAE3]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">Key Parameters</p>
          <span className="text-[11px] font-medium text-[#8A8A8A]">{item.overview.length} markers</span>
        </div>
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-[#4A4A4A] sm:grid-cols-2">
          {visibleOverview.map((test) => (
            <li key={`${item.id}-${test}`} className="flex items-center gap-1.5 truncate" title={test}>
              <Check className="h-3 w-3 shrink-0 text-[#F7931E]" />
              <span className="truncate">{test}</span>
            </li>
          ))}
        </ul>
        {hasMoreDetails && (
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#F7931E] hover:underline"
          >
            <span>{showDetails ? "Show Less" : `+${item.overview.length - compactOverview.length} More Parameters`}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Why This Package */}
      <div className="mt-4 rounded-2xl border border-[#F0EAE3] bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">Why Choose This</p>
        <ul className="mt-2.5 space-y-2 text-xs leading-5 text-[#5f6868]">
          {item.whyPackage.map((point) => (
            <li key={`${item.id}-${point}`} className="flex items-start gap-2">
              <Zap className="h-3.5 w-3.5 shrink-0 text-[#F7931E] mt-0.5" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Trust Points */}
      <div className="mt-4 space-y-1.5 border-t border-[#F3ECE6] pt-3 text-xs text-[#5f6868]">
        {trustPoints.map((point) => (
          <div key={point} className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{point}</span>
          </div>
        ))}
      </div>

      {/* Action */}
      <div className="mt-6 pt-2">
        <Link
          href={`/book-home-collection?package=${encodeURIComponent(item.name)}`}
          className="cta-btn w-full rounded-xl py-3.5 text-xs font-bold tracking-wider"
        >
          Book Home Collection
        </Link>
      </div>
    </article>
  );
}
