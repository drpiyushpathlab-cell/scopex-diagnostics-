"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { storeAuthToken } from "@/lib/backend-client";
import { getInsForgeAccessToken, getInsForgeBrowserClient } from "@/lib/insforge-browser";

function CallbackShell({ message, error }: { message?: string; error?: string }) {
  return (
    <section className="section-wrap py-14">
      <div className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Google Login</p>
        <h1 className="mt-2 text-3xl font-black text-[#102a2d] md:text-4xl">Signing you in securely</h1>
        {message ? <p className="mt-4 text-[#5a7273]">{message}</p> : null}
        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-bold">Google login could not be completed.</p>
            <p className="mt-1">{error}</p>
            <Link href="/patient/login" className="secondary-btn mt-4 inline-flex text-xs">
              Back to Login
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PatientGoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing Google login...");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function completeLogin() {
      try {
        const oauthError = searchParams.get("insforge_error");
        if (oauthError) throw new Error(oauthError);

        const client = await getInsForgeBrowserClient();
        const { data, error: userError } = await client.auth.getCurrentUser();
        if (userError) throw new Error(userError.message || "Unable to read Google session.");
        if (!data?.user) throw new Error("Google session was not created. Please try again.");

        const accessToken = getInsForgeAccessToken(client);
        if (!accessToken) throw new Error("Google session token is missing. Please try again.");

        const response = await fetch("/api/auth/google-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken })
        });
        const payload = await response.json().catch(() => ({ message: "Google login returned an invalid response." }));

        if (!response.ok || !payload.token) {
          throw new Error(payload.message || "Unable to complete Google login.");
        }

        storeAuthToken(payload.token);
        if (!cancelled) {
          setMessage("Google login successful. Redirecting to dashboard...");
          router.replace("/patient/dashboard");
          router.refresh();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Google login failed.");
          setMessage("");
        }
      }
    }

    void completeLogin();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return <CallbackShell message={message} error={error} />;
}

export default function PatientGoogleCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell message="Preparing Google login..." />}>
      <PatientGoogleCallbackContent />
    </Suspense>
  );
}
