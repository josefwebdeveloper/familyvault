"use client";

import { AppShell } from "@/components/layout/AppShell";
import { UnlockedGuard } from "@/components/providers/VaultGuard";
import { VaultCard } from "@/components/vault/VaultCard";
import { useVaultStore } from "@/stores/vault-store";

export default function VaultsPage() {
  return (
    <UnlockedGuard>
      <AppShell>
        <VaultsContent />
      </AppShell>
    </UnlockedGuard>
  );
}

function VaultsContent() {
  const { vaults, items } = useVaultStore();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Vaults</h1>
        <p className="text-sm text-slate-400">All your encrypted vaults</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {vaults.map((vault) => (
          <VaultCard
            key={vault.id}
            vault={vault}
            items={items}
            warnings={items.filter((i) => i.vaultId === vault.id && i.riskStatus !== "secure").length}
          />
        ))}
      </div>

      {vaults.find((v) => v.type === "family") && (
        <div className="card border-amber-700/30 bg-amber-900/10">
          <h3 className="font-medium text-amber-200 mb-2">Family Sharing (Simple Mode)</h3>
          <p className="text-sm text-slate-400 mb-3">
            Simple family sharing mode. Both users need the shared family vault password.
            For better security, per-user encrypted vault keys are planned for Phase 2.
          </p>
          <p className="text-xs text-slate-500">
            TODO: Public/private key architecture for per-member vault key encryption.
          </p>
        </div>
      )}
    </div>
  );
}
