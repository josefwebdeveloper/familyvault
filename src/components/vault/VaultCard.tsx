"use client";

import Link from "next/link";
import type { Vault } from "@/types";
import { VAULT_TYPE_ICONS, formatRelativeDate } from "@/lib/utils";
import type { DecryptedVaultItem } from "@/types";

interface VaultCardProps {
  vault: Vault;
  items: DecryptedVaultItem[];
  warnings?: number;
}

export function VaultCard({ vault, items, warnings = 0 }: VaultCardProps) {
  const vaultItems = items.filter((i) => i.vaultId === vault.id);
  const lastUpdated = vaultItems.length
    ? vaultItems.reduce((latest, item) =>
        item.updatedAt > latest ? item.updatedAt : latest, vaultItems[0].updatedAt)
    : vault.updatedAt;

  return (
    <Link
      href={`/vaults/${vault.id}`}
      className="block rounded-xl border border-slate-700 bg-slate-800/50 p-5 hover:border-emerald-500/50 hover:bg-slate-800 transition group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{VAULT_TYPE_ICONS[vault.type] ?? "🔐"}</span>
          <div>
            <h3 className="font-semibold text-slate-100 group-hover:text-emerald-400 transition">
              {vault.name}
            </h3>
            <p className="text-xs text-slate-500 capitalize">{vault.type} vault</p>
          </div>
        </div>
        {warnings > 0 && (
          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
            {warnings} warnings
          </span>
        )}
      </div>

      <div className="flex justify-between text-xs text-slate-400">
        <span>{vaultItems.length} items</span>
        <span>{vault.memberIds.length} member{vault.memberIds.length !== 1 ? "s" : ""}</span>
        <span>Updated {formatRelativeDate(lastUpdated)}</span>
      </div>

      {vault.simpleSharingMode && (
        <p className="mt-2 text-xs text-amber-400/80">
          Simple sharing mode — shared master password required
        </p>
      )}
    </Link>
  );
}
