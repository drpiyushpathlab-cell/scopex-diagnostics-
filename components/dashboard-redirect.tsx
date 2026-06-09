"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDashboardHrefForRole, getStoredAuthUser } from "@/lib/backend-client";

export function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredAuthUser();
    router.replace(user ? getDashboardHrefForRole(user.role) : "/patient/login");
  }, [router]);

  return (
    <section className="section-wrap py-14">
      <div className="rounded-[28px] border border-[#deece9] bg-white p-6 text-[#102a2d] shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold">Opening your dashboard...</h1>
      </div>
    </section>
  );
}
