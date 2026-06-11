"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { storeAuthToken } from "@/lib/backend-client";
import { createInsForgeOAuthCallbackClient, getInsForgeAccessToken, getInsForgeBrowserSession } from "@/lib/insforge-browser";

function logGoogleOAuth(label: string, payload: unknown) {
  console.log(`[GoogleOAuth] ${label}`, payload);
}

function getSafeTokenDebug(token: string) {
  return {
    hasAccessToken: Boolean(token),
    tokenPrefix: token ? `${token.slice(0, 10)}...` : ""
  };
}

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
        const callbackPayload = Object.fromEntries(searchParams.entries());
        logGoogleOAuth("Callback payload", callbackPayload);

        const oauthError = searchParams.get("insforge_error") || searchParams.get("error");
        if (oauthError) throw new Error(oauthError);

        const oauthCode = searchParams.get("insforge_code") || searchParams.get("code") || "";
        logGoogleOAuth("OAuth code received", {
          hasCode: Boolean(oauthCode),
          codeParam: searchParams.get("insforge_code") ? "insforge_code" : searchParams.get("code") ? "code" : "none"
        });

        const client = await createInsForgeOAuthCallbackClient();

        let session = getInsForgeBrowserSession(client);
        let exchangedUser: any = null;
        let exchangedAccessToken = "";
        logGoogleOAuth("Initial session response", {
          hasSession: Boolean(session),
          hasUser: Boolean(session?.user),
          ...getSafeTokenDebug(session?.accessToken || getInsForgeAccessToken(client))
        });

        if (!session?.accessToken && oauthCode) {
          const exchangeResponse = await (client.auth as any).exchangeOAuthCode?.(oauthCode);
          exchangedUser = exchangeResponse?.data?.user || null;
          exchangedAccessToken = exchangeResponse?.data?.accessToken || "";
          logGoogleOAuth("Session exchange response", {
            hasData: Boolean(exchangeResponse?.data),
            error: exchangeResponse?.error
              ? {
                  message: exchangeResponse.error.message,
                  statusCode: exchangeResponse.error.statusCode,
                  code: exchangeResponse.error.error
                }
              : null,
            hasUser: Boolean(exchangeResponse?.data?.user),
            ...getSafeTokenDebug(exchangeResponse?.data?.accessToken || "")
          });

          if (exchangeResponse?.error && !exchangeResponse?.data?.accessToken && !getInsForgeBrowserSession(client)?.accessToken) {
            throw new Error(exchangeResponse.error.message || "Unable to exchange Google login code.");
          }
          session = getInsForgeBrowserSession(client);
        }

        const userResponse = session?.user
          ? { data: { user: session.user }, error: null }
          : exchangedUser
            ? { data: { user: exchangedUser }, error: null }
            : await client.auth.getCurrentUser();
        logGoogleOAuth("User response", {
          hasUser: Boolean(userResponse.data?.user),
          error: userResponse.error
            ? {
                message: userResponse.error.message,
                statusCode: userResponse.error.statusCode,
                code: userResponse.error.error
              }
            : null
        });

        const sessionUser = session?.user || exchangedUser || userResponse.data?.user;
        const accessToken = session?.accessToken || exchangedAccessToken || getInsForgeAccessToken(client);
        logGoogleOAuth("Token response", getSafeTokenDebug(accessToken));

        if (!accessToken) throw new Error("Google session token is missing. Please try again.");
        if (!sessionUser) throw new Error("Google session user is missing. Please try again.");

        const response = await fetch("/api/auth/google-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, user: sessionUser })
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
