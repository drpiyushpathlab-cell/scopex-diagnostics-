import type { Metadata } from "next";
import { HealthAdvisorSection } from "@/components/health-advisor-section";

export const metadata: Metadata = {
  title: "Talk to a Health Advisor",
  description: "Get fast expert guidance to choose the right diagnostic test or package with ScopeX Diagnostics."
};

export default function HealthAdvisorPage() {
  return (
    <section className="py-10 md:py-14">
      <HealthAdvisorSection />
    </section>
  );
}
