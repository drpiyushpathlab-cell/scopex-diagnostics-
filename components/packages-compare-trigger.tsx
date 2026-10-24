"use client";

import React from "react";
import { Scale } from "lucide-react";
import { useCompare } from "@/lib/compare-context";

export function PackagesCompareTrigger() {
  const { openModal, selectedItems } = useCompare();

  return (
    <button
      type="button"
      onClick={openModal}
      className="inline-flex items-center gap-2 rounded-xl border border-stone-800 bg-[#0D0D0D] px-4 py-2 text-xs font-bold text-white hover:bg-[#FF6B00] transition cursor-pointer shadow-xs"
    >
      <Scale className="h-4 w-4 text-[#FF6B00]" />
      <span>Compare Tests &amp; Packages {selectedItems.length > 0 ? `(${selectedItems.length}/3)` : ""}</span>
    </button>
  );
}
