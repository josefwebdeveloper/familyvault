import type { DecryptedVaultItem } from "@/types";

export function normalizeHost(url: string): string {
  if (!url.trim()) return "";
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase().replace(/^www\./, "");
  }
}

export function itemsMatchingUrl(
  items: DecryptedVaultItem[],
  targetUrl: string
): DecryptedVaultItem[] {
  const host = normalizeHost(targetUrl);
  if (!host) return [];

  return items.filter((item) => {
    if (!item.url) return false;
    const itemHost = normalizeHost(item.url);
    return (
      itemHost === host ||
      host.endsWith(itemHost) ||
      itemHost.endsWith(host)
    );
  });
}

export function fullUrl(url: string): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}
