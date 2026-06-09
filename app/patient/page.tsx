import type { Metadata } from "next";
import { PatientDashboard } from "@/components/patient-dashboard";

export const metadata: Metadata = {
  title: "Patient Dashboard",
  description: "Manage ScopeX bookings, family members, payments, and reports."
};

export default function PatientDashboardPage() {
  return <PatientDashboard />;
}
