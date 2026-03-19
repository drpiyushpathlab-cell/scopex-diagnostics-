"use client";

import Link from "next/link";
import { useState } from "react";
import type { BadgeLabel, PackageItem } from "@/lib/data";

const trustPoints = [
  "NABL Standard Processing",
  "Doctor Reviewed Reports",
  "Home Collection Available"
];

const badgeClassMap: Record<BadgeLabel, string> = {
  "Most Popular": "bg-[#FF6A00] text-white shadow-[0_0_22px_rgba(255,106,0,0.42)]",
  "Start Here": "bg-[#22C55E] text-white",
  "Best Value": "bg-[#3B82F6] text-white",
  Premium: "bg-[#EF4444] text-white",
  Recommended: "bg-[#EAB308] text-black",
  Advanced: "bg-[#8B5CF6] text-white",
  Specialized: "bg-[#A16207] text-white"
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function PackageCard({ item }: { item: PackageItem }) {
  const [showDetails, setShowDetails] = useState(false);
  const saveAmount = item.mrp - item.price;
  const highlights = item.tests.slice(0, 6);
  const hasMore = item.tests.length > 6;

  return (
    <article
      id={item.id}
      className={[
        "premium-card group relative flex h-full flex-col overflow-hidden rounded-[28px] p-5 transition duration-300 hover:scale-[1.03] hover:shadow-[0_22px_60px_rgba(0,0,0,0.42)] md:p-6",
        item.featured ? "border-[#FF6A00] shadow-[0_0_0_1px_rgba(255,106,0,0.45),0_18px_60px_rgba(255,106,0,0.18)] lg:scale-[1.02]" : ""
      ].join(" ")}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF6A00]/70 to-transparent opacity-70" />

      <div className="flex items-start justify-between gap-4">
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${badgeClassMap[item.badge]}`}>{item.badge}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FF6A00]">Limited Time Offer</span>
      </div>

      <h3 className={`mt-5 text-[1.55rem] font-bold leading-tight ${item.featured ? "md:text-[2rem]" : "md:text-[1.72rem]"}`}>{item.name}</h3>
      <p className="premium-muted mt-2 text-sm md:text-[15px]">{item.tagline}</p>

      <div className="mt-6 flex items-end gap-3">
        <p className={`font-bold leading-none text-[#FF6A00] ${item.featured ? "text-5xl" : "text-[2.4rem]"}`}>{"\u20B9"}{formatCurrency(item.price)}</p>
        <div className="pb-1">
          <p className="premium-subtle text-sm line-through">MRP {"\u20B9"}{formatCurrency(item.mrp)}</p>
          <p className="text-sm font-semibold text-[#FF6A00]">{item.discount}% OFF</p>
        </div>
      </div>

      <p className="mt-2 text-sm font-semibold text-[#FF6A00]">Save {"\u20B9"}{formatCurrency(saveAmount)}</p>

      <div className="premium-card-soft mt-6 rounded-2xl p-4">
        <p className="premium-subtle text-xs font-semibold uppercase tracking-[0.14em]">Test Highlights</p>
        <ul className="mt-3 space-y-2 text-sm leading-6">
          {highlights.map((test) => (
            <li key={test} className="break-words">
              {test}
            </li>
          ))}
          {hasMore ? <li className="font-semibold text-[#FF6A00]">...</li> : null}
        </ul>
      </div>

      {showDetails ? (
        <div className="premium-card-soft mt-4 rounded-2xl p-4">
          <p className="premium-subtle text-xs font-semibold uppercase tracking-[0.14em]">Full Includes</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 sm:grid-cols-2">
            {item.tests.map((test) => (
              <li key={`${item.id}-${test}`}>{test}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="premium-card-soft mt-5 rounded-2xl p-4">
        <p className="premium-subtle text-xs font-semibold uppercase tracking-[0.14em]">Best For</p>
        <p className="mt-2 text-sm font-medium">{item.bestFor}</p>
      </div>

      <div className="premium-muted mt-5 space-y-2 text-sm">
        {trustPoints.map((point) => (
          <p key={point}>{"\u2714"} {point}</p>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <Link
          href={`/book-home-collection?package=${encodeURIComponent(item.name)}`}
          className="cta-btn w-full justify-center text-center [animation:heroPulse_2.8s_ease-in-out_infinite]"
        >
          Book Home Collection
        </Link>
        <button type="button" onClick={() => setShowDetails((prev) => !prev)} className="secondary-btn w-full justify-center text-center">
          {showDetails ? "Hide Details" : "View Details"}
        </button>
      </div>
    </article>
  );
}
