import type { Metadata } from "next";
import { TestsCatalog } from "@/components/tests-catalog";

export const metadata: Metadata = {
  title: "Individual Tests",
  description: "Browse and book individual diagnostic tests by category."
};

export default function TestsPage({
  searchParams
}: {
  searchParams?: { search?: string; focus?: string };
}) {
  return <TestsCatalog initialSearch={searchParams?.search ?? ""} initialFocus={searchParams?.focus ?? ""} />;
}
