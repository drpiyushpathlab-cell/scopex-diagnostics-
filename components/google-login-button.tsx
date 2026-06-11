"use client";

import { useState } from "react";
import { getInsForgeBrowserClient } from "@/lib/insforge-browser";

export function GoogleLoginButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function continueWithGoogle() {
    setStatus("loading");
    setMessage("");

    try {
      const client = await getInsForgeBrowserClient();
      const redirectTo = `${window.location.origin}/patient/google-callback`;
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        redirectTo
      });

      if (error) {
        setStatus("error");
        setMessage(error.message || "Google login could not be started.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Google login could not be started.");
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#dbe9e7] bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-[#102a2d] shadow-[0_12px_24px_rgba(16,24,40,0.05)] transition hover:border-[#0f8f7c] hover:bg-[#f7fbfa] disabled:cursor-wait disabled:opacity-70"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(16,24,40,0.10)]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
          </svg>
        </span>
        {status === "loading" ? "Opening Google..." : "Continue with Google"}
      </button>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
