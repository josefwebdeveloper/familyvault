"use client";

import { useState, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { UnlockedGuard } from "@/components/providers/VaultGuard";
import { useVaultStore, useAuthStore } from "@/stores/vault-store";
import { getAllUserItems } from "@/lib/firebase/firestore";
import { backupSchema } from "@/lib/validation/schemas";
import { toast } from "@/components/ui/Toast";
import type { BackupData } from "@/types";

export default function BackupPage() {
  return (
    <UnlockedGuard>
      <AppShell>
        <BackupContent />
      </AppShell>
    </UnlockedGuard>
  );
}

function BackupContent() {
  const { user } = useAuthStore();
  const { vaults, userProfile } = useVaultStore();
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!user || !userProfile) return;

    try {
      const items = await getAllUserItems(user.uid);
      const backup: BackupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        userId: user.uid,
        vaults,
        items,
        crypto: userProfile.crypto,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `familyvault-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Encrypted backup exported", "success");
    } catch {
      toast("Export failed", "error");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = backupSchema.safeParse(data);

      if (!result.success) {
        toast("Invalid backup file format", "error");
        return;
      }

      toast(
        "Backup validated. Full import requires re-syncing items — use this as a recovery reference.",
        "info"
      );
    } catch {
      toast("Failed to read backup file", "error");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Encrypted Backup</h1>
        <p className="text-sm text-slate-400">
          Export and import your encrypted vault data.
        </p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-medium text-slate-200">Export Backup</h2>
        <p className="text-sm text-slate-400">
          Downloads a JSON file containing your encrypted vault items and metadata.
          Passwords and notes remain encrypted — you need your master password to decrypt.
        </p>
        <button onClick={handleExport} className="btn-primary">
          Export Encrypted Backup
        </button>
      </div>

      <div className="card space-y-4">
        <h2 className="font-medium text-slate-200">Import Backup</h2>
        <p className="text-sm text-slate-400">
          Restore from a previously exported encrypted backup file.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="text-sm text-slate-400"
        />
        {importing && <p className="text-sm text-slate-400">Validating backup...</p>}
      </div>

      <div className="card border-red-800/30 bg-red-900/10">
        <h2 className="font-medium text-red-300 mb-2">Plaintext Export</h2>
        <p className="text-sm text-slate-400">
          Plaintext export is disabled in this MVP for safety.
          Your encrypted backup is the recommended way to preserve data.
        </p>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p>Backup includes: version, exportedAt, userId, vaults, encrypted items, crypto settings.</p>
        <p>Store backups securely. Anyone with the backup file and your master password can decrypt.</p>
      </div>
    </div>
  );
}
