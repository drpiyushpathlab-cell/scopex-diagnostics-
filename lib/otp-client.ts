"use client";

const STORAGE_KEY = "scopex_patient_mobile";

export function storeVerifiedMobile(mobile: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, mobile);
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getVerifiedMobile() {
  if (typeof window === "undefined") return "";
  const sessionMobile = window.sessionStorage.getItem(STORAGE_KEY);
  if (sessionMobile) return sessionMobile;

  const legacyMobile = window.localStorage.getItem(STORAGE_KEY);
  if (legacyMobile) {
    window.sessionStorage.setItem(STORAGE_KEY, legacyMobile);
    window.localStorage.removeItem(STORAGE_KEY);
    return legacyMobile;
  }

  return "";
}

export function clearVerifiedMobile() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(STORAGE_KEY);
}
