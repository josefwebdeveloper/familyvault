"use client";

import { useState, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { UnlockedGuard } from "@/components/providers/VaultGuard";
import { useVaultStore } from "@/stores/vault-store";
import { parsePasswordCsv } from "@/lib/import/csv-import";
import { saveItemFromForm } from "@/lib/vault/save-item";
import { toast } from "@/components/ui/Toast";
import type { ItemFormData } from "@/components/vault/ItemForm";

export default function ImportPage() {
  return (
    <UnlockedGuard>
      <AppShell>
        <ImportContent />
      </AppShell>
    </UnlockedGuard>
  );
}

function ImportContent() {
  const { vaults, vaultKey, items, addItem } = useVaultStore();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; skip: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const personalVault = vaults.find((v) => v.type === "personal");

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vaultKey || !personalVault) return;

    setImporting(true);
    setResult(null);
    let ok = 0;
    let skip = 0;

    try {
      const text = await file.text();
      const rows = parsePasswordCsv(text);

      if (rows.length === 0) {
        toast("No passwords found in CSV", "error");
        return;
      }

      let currentItems = [...items];

      for (const row of rows) {
        if (!row.password) {
          skip++;
          continue;
        }

        const data: ItemFormData = {
          title: row.title,
          url: row.url,
          username: row.username,
          password: row.password,
          notes: row.notes,
          backupCodes: "",
          category: row.url.includes("github") ? "developer" : "login",
          vaultId: personalVault.id,
          ownerLabel: "Family",
          importance: "medium",
          twoFactorEnabled: "unknown",
          passkeyEnabled: "unknown",
          recoveryEmailChecked: "unknown",
          recoveryPhoneChecked: "unknown",
          backupCodesSaved: "unknown",
          passwordChangedAt: new Date().toISOString().split("T")[0],
          remindRotation: false,
        };

        const saved = await saveItemFromForm(data, vaultKey, undefined, currentItems);
        addItem(saved);
        currentItems.push(saved);
        ok++;
      }

      setResult({ ok, skip });
      toast(`Imported ${ok} passwords`, "success");
    } catch {
      toast("Import failed", "error");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Import from browser</h1>
        <p className="text-sm text-slate-400">
          Import passwords from Chrome, Edge, or Brave — processed locally, never sent to a server unencrypted.
        </p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-medium text-slate-200">Chrome / Edge / Brave</h2>
        <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
          <li>Open <code className="text-slate-300">chrome://password-manager/settings</code></li>
          <li>Click <strong className="text-slate-300">Download file</strong> (Export passwords)</li>
          <li>Upload the CSV file below</li>
        </ol>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          disabled={importing}
          onChange={handleImport}
          className="text-sm text-slate-400"
        />

        {importing && <p className="text-sm text-emerald-400">Importing and encrypting…</p>}

        {result && (
          <p className="text-sm text-emerald-300">
            Imported {result.ok} items into Personal Vault
            {result.skip > 0 ? ` (${result.skip} skipped)` : ""}.
          </p>
        )}
      </div>

      <div className="card border-amber-700/30 bg-amber-900/10 text-sm text-slate-400">
        <p className="text-amber-200 font-medium mb-2">Security note</p>
        <p>
          CSV contains plaintext passwords. Import only on your trusted device.
          After import, delete the CSV file from Downloads.
          All items are encrypted before saving to Firebase.
        </p>
      </div>
    </div>
  );
}
