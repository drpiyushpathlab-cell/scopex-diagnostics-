"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredAuthUser, logoutAuthSession } from "@/lib/backend-client";

const ADMIN_IDLE_LIMIT_MS = 15 * 60 * 1000;

export function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredAuthUser();
    if (!user || !["admin", "manager", "super_admin", "super-admin", "booking_manager", "report_manager", "finance_manager", "customer_support"].includes(String(user.role))) {
      router.replace("/admin/login");
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await logoutAuthSession();
        router.replace("/admin/login?reason=idle");
      }, ADMIN_IDLE_LIMIT_MS);
    };

    const events = ["click", "keydown", "mousemove", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [router]);

  return <>{children}</>;
}
