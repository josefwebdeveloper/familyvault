"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { UnlockedGuard } from "@/components/providers/VaultGuard";
import { ItemTable } from "@/components/vault/ItemViews";
import { ItemForm, type ItemFormData } from "@/components/vault/ItemForm";
import { EmptyState } from "@/components/ui/States";
import { ConfirmDialog } from "@/components/ui/States";
import { useVaultStore } from "@/stores/vault-store";
import { saveVaultItem, deleteVaultItem } from "@/lib/firebase/firestore";
import { encryptItemSecrets } from "@/lib/vault/service";
import { computeRiskStatus, detectReuseGroups } from "@/lib/security/analysis";
import type { DecryptedVaultItem, ItemCategory } from "@/types";
import { toast } from "@/components/ui/Toast";
import { CATEGORIES } from "@/components/vault/ItemViews";

export default function VaultDetailPage() {
  return (
    <UnlockedGuard>
      <AppShell>
        <VaultDetailContent />
      </AppShell>
    </UnlockedGuard>
  );
}

function VaultDetailContent() {
  const params = useParams();
  const vaultId = params.vaultId as string;
  const { vaults, items, vaultKey, addItem, updateItem, removeItem } = useVaultStore();

  const vault = vaults.find((v) => v.id === vaultId);
  const vaultItems = useMemo(
    () => items.filter((i) => i.vaultId === vaultId),
    [items, vaultId]
  );

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"priority" | "updated" | "title">("priority");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DecryptedVaultItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<DecryptedVaultItem | undefined>();

  const filteredItems = useMemo(() => {
    let result = [...vaultItems];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.username.toLowerCase().includes(q) ||
          i.url.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((i) => i.category === categoryFilter);
    }

    const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    result.sort((a, b) => {
      if (sortBy === "priority") return importanceOrder[a.importance] - importanceOrder[b.importance];
      if (sortBy === "updated") return b.updatedAt.localeCompare(a.updatedAt);
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [vaultItems, search, categoryFilter, sortBy]);

  const handleSave = useCallback(async (data: ItemFormData) => {
    if (!vaultKey) throw new Error("Vault locked");

    const secrets = {
      password: data.password,
      notes: data.notes,
      backupCodes: data.backupCodes,
    };

    const { encryptedPayloadBase64, ivBase64 } = await encryptItemSecrets(secrets, vaultKey);
    const now = new Date().toISOString();

    const metadata = {
      title: data.title,
      url: data.url,
      username: data.username,
      category: data.category as ItemCategory,
      ownerLabel: data.ownerLabel,
      importance: data.importance,
      riskStatus: "secure" as const,
      securityChecklist: {
        twoFactorEnabled: data.twoFactorEnabled,
        passkeyEnabled: data.passkeyEnabled,
        recoveryEmailChecked: data.recoveryEmailChecked,
        recoveryPhoneChecked: data.recoveryPhoneChecked,
        backupCodesSaved: data.backupCodesSaved,
      },
      encryptedPayloadBase64,
      ivBase64,
      passwordChangedAt: data.passwordChangedAt,
      createdAt: editingItem?.createdAt ?? now,
      updatedAt: now,
      id: editingItem?.id,
    };

    const itemId = await saveVaultItem(data.vaultId, metadata);

    const decryptedItem: DecryptedVaultItem = {
      ...metadata,
      id: itemId,
      vaultId: data.vaultId,
      secrets,
      riskStatus: "secure",
    };

    const allItems = editingItem
      ? items.map((i) => (i.id === itemId ? decryptedItem : i))
      : [...items, decryptedItem];

    const reuseGroups = detectReuseGroups(allItems);
    decryptedItem.riskStatus = computeRiskStatus(decryptedItem, reuseGroups);

    if (editingItem) {
      updateItem(decryptedItem);
    } else {
      addItem(decryptedItem);
    }

    setShowForm(false);
    setEditingItem(undefined);
    toast("Item saved securely", "success");
  }, [vaultKey, editingItem, items, addItem, updateItem]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteVaultItem(deleteTarget.vaultId, deleteTarget.id);
    removeItem(deleteTarget.id);
    setDeleteTarget(undefined);
    toast("Item deleted", "info");
  };

  if (!vault) {
    return <EmptyState title="Vault not found" description="This vault may have been removed." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{vault.name}</h1>
          <p className="text-sm text-slate-400 capitalize">{vault.type} vault · {vaultItems.length} items</p>
        </div>
        <button onClick={() => { setEditingItem(undefined); setShowForm(true); }} className="btn-primary">
          Add Item
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="input flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input sm:w-40"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="input sm:w-36"
        >
          <option value="priority">By priority</option>
          <option value="updated">By updated</option>
          <option value="title">By title</option>
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon="🔐"
          title="No items yet"
          description="Add your first account, note, or recovery code to this vault."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add First Item
            </button>
          }
        />
      ) : (
        <ItemTable
          items={filteredItems}
          onEdit={(item) => { setEditingItem(item); setShowForm(true); }}
          onDelete={(item) => setDeleteTarget(item)}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-hidden shadow-xl">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              {editingItem ? "Edit Item" : "Add Item"}
            </h3>
            <ItemForm
              vaults={vaults}
              item={editingItem}
              defaultVaultId={vaultId}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingItem(undefined); }}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(undefined)}
      />
    </div>
  );
}
