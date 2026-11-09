"use client";

import { useState } from "react";
import { PackageCard } from "@/components/package-card";
import { CustomPackageBuilder } from "@/components/custom-package-builder";
import type { PackageItem } from "@/lib/data";
import { Layers, Sliders, Sparkles, CheckCircle2 } from "lucide-react";

type PackagesTabsViewProps = {
  fixedPackages: PackageItem[];
  sectionOrder: readonly string[];
  sectionDescriptions: Record<string, string>;
  packageOrderBySection: Record<string, string[]>;
  initialTab?: "fixed" | "custom";
};

export function PackagesTabsView({
  fixedPackages,
  sectionOrder,
  sectionDescriptions,
  packageOrderBySection,
  initialTab = "fixed"
}: PackagesTabsViewProps) {
  const [activeTab, setActiveTab] = useState<"fixed" | "custom">(initialTab);

  return (
    <div className="space-y-8">
      {/* Tab Switcher - Clean Domain-Native Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAEAEA] pb-4">
        <div className="flex items-center gap-2 p-1.5 bg-[#F7F7F7] rounded-xl border border-[#EAEAEA] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("fixed")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === "fixed"
                ? "bg-white text-[#0D0D0D] shadow-xs ring-1 ring-black/5"
                : "text-stone-600 hover:text-[#0D0D0D]"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>Type 1: Fixed Packages ({fixedPackages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === "custom"
                ? "bg-white text-[#0D0D0D] shadow-xs ring-1 ring-black/5"
                : "text-stone-600 hover:text-[#0D0D0D]"
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>Type 2: Build Custom Package</span>
          </button>
        </div>

        <div className="text-xs text-stone-500">
          {activeTab === "fixed" ? (
            <span>Non-modifiable pathologist panels · Reference price &amp; savings calculated automatically</span>
          ) : (
            <span>Select individual tests · Dynamic bundle discount with test discount caps enforced</span>
          )}
        </div>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === "fixed" ? (
        <div className="space-y-14">
          {sectionOrder.map((sectionName) => {
            const sectionItems = fixedPackages.filter((item) => item.section === sectionName);
            if (!sectionItems.length) return null;
            const desiredOrder = packageOrderBySection[sectionName] || [];
            const orderedItems = desiredOrder
              .map((id) => sectionItems.find((item) => item.id === id))
              .filter((item): item is NonNullable<typeof item> => Boolean(item));

            const displayList = orderedItems.length > 0 ? orderedItems : sectionItems;

            return (
              <div key={sectionName}>
                <div className="mb-6 max-w-3xl border-b border-[#EAEAEA] pb-3">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF6B00]">{sectionName}</span>
                  <p className="mt-1 text-xs sm:text-sm text-[#626262]">{sectionDescriptions[sectionName]}</p>
                </div>

                <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {displayList.map((item) => (
                    <div key={item.id}>
                      <PackageCard item={item} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <CustomPackageBuilder />
      )}
    </div>
  );
}
