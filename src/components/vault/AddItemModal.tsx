"use client";

import { useState } from "react";
import { ItemForm, type ItemFormData } from "@/components/vault/ItemForm";
import { useVaultStore } from "@/stores/vault-store";
import { saveItemFromForm } from "@/lib/vault/save-item";
import { toast } from "@/components/ui/Toast";
import type { DecryptedVaultItem } from "@/types";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  defaultVaultId?: string;
}

export function AddItemModal({ open, onClose, defaultVaultId }: AddItemModalProps) {
  const { vaults, vaultKey, items, addItem, updateItem } = useVaultStore();
  const [draftItem, setDraftItem] = useState<DecryptedVaultItem | undefined>();

  if (!open) return null;

  const handleSave = async (data: ItemFormData, options?: { isAutoSave?: boolean }) => {
    if (!vaultKey) throw new Error("Vault locked");

    const existing = draftItem;
    const saved = await saveItemFromForm(data, vaultKey, existing, items);

    if (existing) {
      updateItem(saved);
    } else {
      addItem(saved);
      setDraftItem(saved);
    }

    if (!options?.isAutoSave) {
      toast("Item saved securely", "success");
      setDraftItem(undefined);
      onClose();
    }
  };

  const handleClose = () => {
    setDraftItem(undefined);
    onClose();
  };

  const personalVault = vaults.find((v) => v.type === "personal");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-hidden shadow-xl">
        <h3 className="text-lg font-semibold text-slate-100 mb-1">Add account</h3>
        <p className="text-xs text-slate-400 mb-4">
          Starts saving automatically once you enter a title — no need to click Save.
        </p>
        <ItemForm
          vaults={vaults}
          item={draftItem}
          defaultVaultId={defaultVaultId ?? personalVault?.id}
          onSave={handleSave}
          onCancel={handleClose}
          autoSave
        />
      </div>
    </div>
  );
}
