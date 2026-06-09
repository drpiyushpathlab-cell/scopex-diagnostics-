import type { Metadata } from "next";
import { OtpLoginCard } from "@/components/otp-login-card";

export const metadata: Metadata = {
  title: "Patient Login",
  description: "OTP-based patient login for ScopeX Diagnostics bookings and reports."
};

export default function PatientLoginPage() {
  return (
    <section className="section-wrap py-14">
      <OtpLoginCard />
    </section>
  );
}
