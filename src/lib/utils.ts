"use client";

export async function copyToClipboard(text: string, clearAfterMs = 30000): Promise<void> {
  await navigator.clipboard.writeText(text);

  if (clearAfterMs > 0) {
    setTimeout(async () => {
      try {
        const current = await navigator.clipboard.readText();
        if (current === text) {
          await navigator.clipboard.writeText("");
        }
      } catch {
        // Browser may block clipboard read/write — safe to ignore
      }
    }, clearAfterMs);
  }
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const VAULT_TYPE_ICONS: Record<string, string> = {
  personal: "👤",
  family: "👨‍👩‍👧‍👦",
  developer: "💻",
  emergency: "🚨",
};

export const RISK_COLORS: Record<string, string> = {
  secure: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  weak_password: "bg-red-500/20 text-red-400 border-red-500/30",
  reused_password: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  needs_2fa: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  needs_passkey: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  old_password: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export const IMPORTANCE_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400",
  high: "bg-orange-500/20 text-orange-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-slate-500/20 text-slate-400",
};
