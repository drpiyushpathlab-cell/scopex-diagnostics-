"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDashboardHrefForRole, storeAuthToken } from "@/lib/backend-client";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get("email") || email).trim();
    const submittedPassword = String(formData.get("password") || password);

    if (!submittedEmail || !submittedPassword) {
      setStatus("error");
      setMessage("Enter admin email and password.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submittedEmail, password: submittedPassword })
      });
      const data = await response.json().catch(() => ({ message: "Login failed. Please try again." }));

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message || "Unable to sign in. Check email and password.");
        return;
      }

      if (!data.token) {
        setStatus("error");
        setMessage("Login succeeded but no session token was returned. Please contact support.");
        return;
      }

      storeAuthToken(data.token);
      setMessage("Login successful. Opening dashboard...");
      const route = getDashboardHrefForRole(data.user?.role);
      router.push(route);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to sign in. Please check backend connection.");
    }
  }

  return (
    <form method="post" action="/api/admin/login" onSubmit={onSubmit} className="rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#FF6B00]">Admin Login</p>
      <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Operations and booking dashboard</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[#5f6868] md:text-base">
        Sign in with your admin credentials to review bookings, payments, advisor callbacks, and booking conversions.
      </p>

      <div className="mt-6 grid gap-4 md:max-w-md">
        <input suppressHydrationWarning name="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Admin email" autoComplete="username" className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#FF6B00]" />
        <input suppressHydrationWarning name="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" autoComplete="current-password" className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#FF6B00]" />
        <button type="submit" className="cta-btn w-full sm:w-fit" disabled={status === "loading"}>
          {status === "loading" ? "Signing in..." : "Sign in"}
        </button>
        {message ? <p className={`text-sm ${status === "error" ? "text-red-600" : "text-[#FF6B00]"}`}>{message}</p> : null}
      </div>

    </form>
  );
}
