"use client";

import { useState } from "react";
import type { DecryptedVaultItem, Vault, ItemCategory, OwnerLabel, Importance } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { RiskBadge, CategoryBadge, ImportanceBadge } from "@/components/ui/Badges";
import { RevealSecretButton, CopyButton } from "@/components/ui/CopyButton";
import { UseOnSiteButton } from "@/components/vault/UseOnSiteButton";
import { formatRelativeDate } from "@/lib/utils";

interface ItemCardProps {
  item: DecryptedVaultItem;
  onEdit: (item: DecryptedVaultItem) => void;
  onDelete: (item: DecryptedVaultItem) => void;
}

export function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-slate-100">{item.title}</h4>
          {item.url && (
            <a
              href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:underline"
            >
              {item.url}
            </a>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(item)}
            className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item)}
            className="text-xs px-2 py-1 rounded bg-red-900/50 text-red-400 hover:bg-red-900"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <CategoryBadge category={item.category} />
        <ImportanceBadge importance={item.importance} />
        <RiskBadge status={item.riskStatus} />
        <span className="text-xs text-slate-500">{item.ownerLabel}</span>
      </div>

      {item.username && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-500">Username:</span>
          <span className="text-sm text-slate-300">{item.username}</span>
          <CopyButton value={item.username} label="Username" />
        </div>
      )}

      {item.secrets.password && (
        <div className="mb-2">
          <span className="text-xs text-slate-500 block mb-1">Password:</span>
          <RevealSecretButton value={item.secrets.password} />
        </div>
      )}

      <p className="text-xs text-slate-500 mt-2">
        Updated {formatRelativeDate(item.updatedAt)}
      </p>
    </div>
  );
}

interface ItemTableProps {
  items: DecryptedVaultItem[];
  onEdit: (item: DecryptedVaultItem) => void;
  onDelete: (item: DecryptedVaultItem) => void;
}

export function ItemTable({ items, onEdit, onDelete }: ItemTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-left">
            <th className="pb-3 pr-4 font-medium">Title</th>
            <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Category</th>
            <th className="pb-3 pr-4 font-medium hidden md:table-cell">Username</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/30">
              <td className="py-3 pr-4">
                <div className="font-medium text-slate-200">{item.title}</div>
                <ImportanceBadge importance={item.importance} />
              </td>
              <td className="py-3 pr-4 hidden sm:table-cell">
                <CategoryBadge category={item.category} />
              </td>
              <td className="py-3 pr-4 hidden md:table-cell text-slate-400">
                {item.username || "—"}
              </td>
              <td className="py-3 pr-4">
                <RiskBadge status={item.riskStatus} />
              </td>
              <td className="py-3">
                <div className="flex flex-wrap gap-1">
                  <UseOnSiteButton item={item} compact />
                  {item.secrets.password && (
                    <CopyButton value={item.secrets.password} label="Password" />
                  )}
                  <button
                    onClick={() => onEdit(item)}
                    className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="text-xs px-2 py-1 rounded bg-red-900/50 text-red-400"
                  >
                    Del
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Checklist({ items }: { items: { label: string; done: boolean }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <span className={item.done ? "text-emerald-400" : "text-slate-500"}>
            {item.done ? "✓" : "○"}
          </span>
          <span className={item.done ? "text-slate-400 line-through" : "text-slate-300"}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as ItemCategory[];
export const OWNERS: OwnerLabel[] = ["Iosif", "Elena", "Family", "Other"];
export const IMPORTANCE_LEVELS: Importance[] = ["critical", "high", "medium", "low"];
