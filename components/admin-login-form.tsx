"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDashboardHrefForRole, getStoredAuthToken, getStoredAuthUser, storeAuthToken } from "@/lib/backend-client";

type LoginDebugState = {
  clicked: boolean;
  apiStatus: string;
  tokenPresent: boolean;
  userEmail: string;
  role: string;
  redirectTo: string;
};

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [debug, setDebug] = useState<LoginDebugState>({
    clicked: false,
    apiStatus: "Not started",
    tokenPresent: Boolean(getStoredAuthToken()),
    userEmail: getStoredAuthUser()?.email || "-",
    role: String(getStoredAuthUser()?.role || "-"),
    redirectTo: "-"
  });
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("Login Clicked");
    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get("email") || email).trim();
    const submittedPassword = String(formData.get("password") || password);
    setDebug((current) => ({ ...current, clicked: true, apiStatus: "Validating form" }));

    if (!submittedEmail || !submittedPassword) {
      setStatus("error");
      setMessage("Enter admin email and password.");
      setDebug((current) => ({ ...current, apiStatus: "Validation failed" }));
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
      console.log("API Response", response);
      const data = await response.json().catch(() => ({ message: "Login failed. Please try again." }));
      console.log("User", data.user);
      console.log("Role", data.user?.role);
      console.log("Token", data.token ? `${String(data.token).slice(0, 14)}...redacted` : "");
      setDebug((current) => ({
        ...current,
        apiStatus: `${response.status} ${response.ok ? "OK" : "Failed"}`,
        userEmail: data.user?.email || "-",
        role: String(data.user?.role || "-"),
        tokenPresent: Boolean(data.token)
      }));

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
      console.log("Redirecting To", route);
      setDebug((current) => ({ ...current, tokenPresent: Boolean(getStoredAuthToken()), redirectTo: route }));
      router.push(route);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to sign in. Please check backend connection.");
      setDebug((current) => ({ ...current, apiStatus: "Request crashed" }));
    }
  }

  return (
    <form method="post" action="/api/admin/login" onSubmit={onSubmit} className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Admin Login</p>
      <h1 className="mt-2 text-3xl font-bold text-[#102a2d] md:text-4xl">Operations and booking dashboard</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[#5a7273] md:text-base">
        Sign in with your admin credentials to review bookings, payments, advisor callbacks, and booking conversions.
      </p>

      <div className="mt-6 grid gap-4 md:max-w-md">
        <input suppressHydrationWarning name="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Admin email" autoComplete="username" className="rounded-2xl border border-[#dbe9e7] px-4 py-3 text-sm outline-none focus:border-[#0f8f7c]" />
        <input suppressHydrationWarning name="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" autoComplete="current-password" className="rounded-2xl border border-[#dbe9e7] px-4 py-3 text-sm outline-none focus:border-[#0f8f7c]" />
        <button type="submit" className="cta-btn w-full sm:w-fit" disabled={status === "loading"}>
          {status === "loading" ? "Signing in..." : "Sign in"}
        </button>
        {message ? <p className={`text-sm ${status === "error" ? "text-red-600" : "text-[#0f8f7c]"}`}>{message}</p> : null}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-[#cfe3df] bg-[#f7fbfa] p-4 text-xs leading-6 text-[#45666a]">
        <p className="font-bold uppercase tracking-[0.16em] text-[#0f8f7c]">Temporary Auth Debug</p>
        <p>Clicked: {String(debug.clicked)}</p>
        <p>API: {debug.apiStatus}</p>
        <p>User: {debug.userEmail}</p>
        <p>Role: {debug.role}</p>
        <p>Token Present: {String(debug.tokenPresent)}</p>
        <p>Redirecting To: {debug.redirectTo}</p>
      </div>
    </form>
  );
}
