"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredAuthUser, onAuthChange, storeAuthToken } from "@/lib/backend-client";
import { PhlebotomistPortal } from "@/components/phlebotomist-portal";

export function PhlebotomistAccess() {
  const router = useRouter();
  const [user, setUser] = useState(getStoredAuthUser());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthChange(() => setUser(getStoredAuthUser())), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/backend/phlebotomist/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token || data.user?.role !== "phlebotomist") {
        throw new Error(data.message || data.error || "Unable to sign in with this staff account.");
      }
      storeAuthToken(data.token);
      setPassword("");
      setUser(data.user);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  if (user?.role === "phlebotomist") return <PhlebotomistPortal />;
  if (user) return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">This session does not have phlebotomist access. Sign out before using this page.</div>;

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Staff Access</p>
        <h1 className="mt-2 text-2xl font-black text-gray-950">Phlebotomist Login</h1>
        <p className="mt-2 text-sm text-gray-600">Use the invited staff account. Only active, approved profiles can access assigned collections.</p>
      </div>
      <label className="block text-sm font-semibold text-gray-700">Email
        <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5" />
      </label>
      <label className="block text-sm font-semibold text-gray-700">Password
        <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5" />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-[#F5A623] px-4 py-3 text-sm font-bold text-gray-950 disabled:opacity-60">{busy ? "Signing in…" : "Sign In"}</button>
    </form>
  );
}
