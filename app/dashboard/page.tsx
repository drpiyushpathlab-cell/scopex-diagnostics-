import type { Metadata } from "next";
import { DashboardRedirect } from "@/components/dashboard-redirect";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Redirect to your ScopeX dashboard."
};

export default function DashboardPage() {
  return <DashboardRedirect />;
}
