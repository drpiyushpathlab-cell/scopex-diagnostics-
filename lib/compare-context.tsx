"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { TestItem, PackageItem } from "@/lib/data";
import { testsData, packagesData } from "@/lib/data";

export type ComparableItem = {
  id: string; // unique id prefixed e.g. "test-cbc" or "pkg-health-360-pro"
  originalId: string;
  type: "test" | "package";
  name: string;
  badge?: string;
  category: string;
  price: number;
  mrp: number;
  discount: number;
  tagline: string;
  fastingHours: string;
  sampleType: string;
  tat: string;
  markers: string[];
  whyOrBenefits: string[];
  bestFor: string[];
  bookUrl: string;
};

type CompareContextType = {
  selectedItems: ComparableItem[];
  addItem: (item: ComparableItem) => boolean;
  removeItem: (id: string) => void;
  toggleItem: (item: ComparableItem) => void;
  isItemComparing: (id: string) => boolean;
  clearAll: () => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  warningMessage: string | null;
  clearWarning: () => void;
  availableTests: TestItem[];
  availablePackages: PackageItem[];
};

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const STORAGE_KEY = "scopex_compare_items_v1";

export function testToComparable(test: TestItem): ComparableItem {
  const calculatedMrp = test.mrp || Math.round(test.price * 1.38);
  const calculatedDiscount =
    test.discount || (calculatedMrp > test.price ? Math.round(((calculatedMrp - test.price) / calculatedMrp) * 100) : 25);
  const markersList =
    test.components && test.components.length > 0
      ? test.components
      : [test.name, "Clinical Reference Verification"];

  return {
    id: `test-${test.id}`,
    originalId: test.id,
    type: "test",
    name: test.name,
    badge: test.category,
    category: test.group,
    price: test.price,
    mrp: calculatedMrp,
    discount: calculatedDiscount,
    tagline: test.fastingHours ? `${test.fastingHours} Fasting Required` : "Routine Individual Diagnostic Biomarker",
    fastingHours: test.fastingHours || "Not Required",
    sampleType: test.category === "Blood" ? "Blood (Sterile Vacutainer)" : "Blood / Serum",
    tat: "12-24 Hours",
    markers: markersList,
    whyOrBenefits: [
      "Targeted biomarker precision",
      "NABL accredited reference lab testing",
      "Instant digital report on WhatsApp & Portal",
      "Free doorstep sample collection available"
    ],
    bestFor: ["Doctor-prescribed monitoring", "Specific symptom investigation", "Routine wellness check"],
    bookUrl: `/book-home-collection?test=${encodeURIComponent(test.name)}`
  };
}

export function packageToComparable(pkg: PackageItem): ComparableItem {
  return {
    id: `pkg-${pkg.id}`,
    originalId: pkg.id,
    type: "package",
    name: pkg.name,
    badge: pkg.badge,
    category: pkg.section,
    price: pkg.price,
    mrp: pkg.mrp,
    discount: pkg.discount,
    tagline: pkg.tagline,
    fastingHours: "10-12 Hours Overnight Fasting Recommended",
    sampleType: "Blood & Urine (Complete Panel)",
    tat: "12-24 Hours",
    markers: pkg.overview,
    whyOrBenefits: pkg.whyPackage.length > 0 ? pkg.whyPackage : [
      "Comprehensive multi-organ evaluation",
      "Discounted bundle price vs individual testing",
      "Free doctor consultation on abnormal findings",
      "Sterile doorstep sample collection included"
    ],
    bestFor: pkg.bestFor.length > 0 ? pkg.bestFor : ["Annual preventive screening", "Families and working professionals"],
    bookUrl: `/book-home-collection?package=${encodeURIComponent(pkg.name)}`
  };
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selectedItems, setSelectedItems] = useState<ComparableItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Initialize from storage on mount
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSelectedItems(parsed.slice(0, 3));
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Sync to storage
  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedItems));
    } catch {
      // ignore storage errors
    }
  }, [selectedItems]);

  const addItem = (item: ComparableItem): boolean => {
    if (selectedItems.some((i) => i.id === item.id)) {
      return true;
    }
    if (selectedItems.length >= 3) {
      setWarningMessage("You can compare up to 3 tests or packages at a time. Remove an item to add this one.");
      return false;
    }
    setWarningMessage(null);
    setSelectedItems((prev) => [...prev, item]);
    return true;
  };

  const removeItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== id));
    setWarningMessage(null);
  };

  const toggleItem = (item: ComparableItem) => {
    if (selectedItems.some((i) => i.id === item.id)) {
      removeItem(item.id);
    } else {
      addItem(item);
    }
  };

  const isItemComparing = (id: string) => {
    return selectedItems.some((i) => i.id === id || i.originalId === id);
  };

  const clearAll = () => {
    setSelectedItems([]);
    setWarningMessage(null);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const clearWarning = () => setWarningMessage(null);

  return (
    <CompareContext.Provider
      value={{
        selectedItems,
        addItem,
        removeItem,
        toggleItem,
        isItemComparing,
        clearAll,
        isModalOpen,
        openModal,
        closeModal,
        warningMessage,
        clearWarning,
        availableTests: testsData,
        availablePackages: packagesData
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
