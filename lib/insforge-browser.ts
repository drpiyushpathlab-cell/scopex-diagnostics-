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

function createBrowserClient(config: PublicInsForgeConfig, options?: { autoRefreshToken?: boolean }) {
  return createClient({
    baseUrl: config.baseUrl,
    anonKey: config.anonKey,
    autoRefreshToken: options?.autoRefreshToken
  });
}

export async function getInsForgeBrowserClient() {
  if (!clientPromise) {
    clientPromise = getPublicConfig().then((config) => createBrowserClient(config));
  }

  return clientPromise;
}

export async function createInsForgeOAuthCallbackClient() {
  const config = await getPublicConfig();
  return createBrowserClient(config, { autoRefreshToken: false });
}

export function getInsForgeAccessToken(client: InsForgeClient) {
  return (client as any)?.tokenManager?.getAccessToken?.() || "";
}

export function getInsForgeBrowserSession(client: InsForgeClient) {
  return (client as any)?.tokenManager?.getSession?.() || null;
}
