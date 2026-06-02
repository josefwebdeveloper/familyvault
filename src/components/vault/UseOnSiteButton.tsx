"use client";

import { copyToClipboard } from "@/lib/utils";
import { fullUrl } from "@/lib/vault/url-match";
import type { DecryptedVaultItem } from "@/types";
import { toast } from "@/components/ui/Toast";

interface UseOnSiteButtonProps {
  item: DecryptedVaultItem;
  compact?: boolean;
}

export function UseOnSiteButton({ item, compact = false }: UseOnSiteButtonProps) {
  const handleUse = async () => {
    const url = fullUrl(item.url);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    if (item.username) {
      await copyToClipboard(item.username, 0);
      toast("Username copied — paste into login field", "success");
      await delay(400);
    }

    if (item.secrets.password) {
      await copyToClipboard(item.secrets.password, 30000);
      toast(
        item.username
          ? "Password copied — paste after username (clears in 30s)"
          : "Password copied (clears in 30s)",
        "success"
      );
    }

    if (!url && !item.secrets.password) {
      toast("Add URL or password first", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleUse}
      className={
        compact
          ? "text-xs px-2 py-1 rounded bg-emerald-600/80 text-white hover:bg-emerald-500 whitespace-nowrap"
          : "btn-primary text-xs"
      }
      title="Open site and copy username + password to clipboard"
    >
      {compact ? "Use ↗" : "Open & copy login"}
    </button>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
