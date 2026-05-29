import type { BucketConfiguration } from "@/types";

export const CONFIG_STORAGE_KEY = "elamora_bucket_configuration";

export function saveConfiguration(config: BucketConfiguration) {
  window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function loadConfiguration(): BucketConfiguration | null {
  const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as BucketConfiguration;
  } catch {
    return null;
  }
}

export function clearConfiguration() {
  window.localStorage.removeItem(CONFIG_STORAGE_KEY);
}
