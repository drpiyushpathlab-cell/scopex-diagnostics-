import type { Metadata } from "next";
import { Suspense } from "react";
import { TestsCatalog } from "@/components/tests-catalog";

export const metadata: Metadata = {
  title: "Individual Tests",
  description: "Browse and book individual diagnostic tests by category."
};

export default function TestsPage() {
  return (
    <Suspense fallback={null}>
      <TestsCatalog />
    </Suspense>
  );
}
