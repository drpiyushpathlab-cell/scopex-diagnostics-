import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Secure admin login for ScopeX Diagnostics operations."
};

export default function AdminLoginPage() {
  return (
    <section className="section-wrap py-14">
      <AdminLoginForm />
    </section>
  );
}
