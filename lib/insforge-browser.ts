"use client";

import { createClient, type InsForgeClient } from "@insforge/sdk";

type PublicInsForgeConfig = {
  baseUrl: string;
  anonKey: string;
};

let clientPromise: Promise<InsForgeClient> | null = null;

async function getPublicConfig(): Promise<PublicInsForgeConfig> {
  const envBaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || "";
  const envAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "";

  if (envBaseUrl && envAnonKey) {
    return { baseUrl: envBaseUrl, anonKey: envAnonKey };
  }

  const response = await fetch("/api/insforge/public-config", { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.baseUrl || !data.anonKey) {
    throw new Error(data.message || "InsForge authentication is not configured.");
  }

  return { baseUrl: data.baseUrl, anonKey: data.anonKey };
}

export async function getInsForgeBrowserClient() {
  if (!clientPromise) {
    clientPromise = getPublicConfig().then((config) =>
      createClient({
        baseUrl: config.baseUrl,
        anonKey: config.anonKey
      })
    );
  }

  return clientPromise;
}

export function getInsForgeAccessToken(client: InsForgeClient) {
  return (client as any)?.tokenManager?.getAccessToken?.() || "";
}
