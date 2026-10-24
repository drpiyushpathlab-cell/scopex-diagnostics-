"use client";

import React from "react";
import { Scale, X, ArrowRight, Trash2, AlertCircle } from "lucide-react";
import { useCompare } from "@/lib/compare-context";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-IN").format(val);
}

export function CompareFloatingBar() {
  const {
    selectedItems,
    removeItem,
    clearAll,
    openModal,
    warningMessage,
    clearWarning
  } = useCompare();

  if (selectedItems.length === 0 && !warningMessage) return null;

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 md:left-auto md:right-8 md:max-w-3xl z-40 animate-in slide-in-from-bottom-5 duration-300">
      {/* Warning message if user tries to exceed 3 items */}
      {warningMessage && (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-amber-500 text-stone-950 px-4 py-2 text-xs font-bold shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{warningMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearWarning}
            className="ml-2 rounded-lg p-0.5 hover:bg-amber-600 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="rounded-2xl border border-stone-800 bg-[#0D0D0D] p-3 sm:p-3.5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left: Indicator & Chips */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF6B00] text-white font-black text-xs shadow-xs">
                  <Scale className="h-4 w-4" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-black tracking-tight text-white leading-none">
                    Compare Items
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {selectedItems.length} of 3 selected
                  </p>
                </div>
              </div>

              {/* Chips */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-900/90 px-2.5 py-1 text-xs shrink-0 max-w-[170px]"
                  >
                    <div className="truncate">
                      <span className="font-bold text-white text-[11px] truncate block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-[#FF6B00] font-semibold">
                        ₹{formatCurrency(item.price)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-md p-0.5 text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
                      title="Remove"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {/* Empty slot placeholder */}
                {selectedItems.length < 3 && (
                  <div className="hidden md:flex items-center rounded-xl border border-dashed border-stone-700 px-2.5 py-1 text-[11px] text-stone-400 shrink-0">
                    + Add {3 - selectedItems.length} more
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={clearAll}
                className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-400 hover:text-white transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={openModal}
                className="cta-btn text-xs font-bold py-2 px-4 shadow-[0_6px_20px_rgba(255,107,0,0.35)] cursor-pointer"
              >
                <span>Compare Now ({selectedItems.length}/3)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
