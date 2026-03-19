import type { Metadata } from "next";
import { HowItWorks } from "@/components/how-it-works";

export const metadata: Metadata = {
  title: "Process",
  description: "Understand the SCOPEX diagnostics flow from booking to report delivery."
};

export default function ProcessPage() {
  return <HowItWorks />;
}
