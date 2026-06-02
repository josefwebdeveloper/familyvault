"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { UnlockedGuard } from "@/components/providers/VaultGuard";
import { SecurityScoreCard } from "@/components/dashboard/SecurityScoreCard";
import { PasswordDetoxCard } from "@/components/dashboard/PasswordDetoxCard";
import { VaultCard } from "@/components/vault/VaultCard";
import { useVaultStore } from "@/stores/vault-store";
import { calculateSecurityScore } from "@/lib/security/analysis";

export default function DashboardPage() {
  return (
    <UnlockedGuard>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </UnlockedGuard>
  );
}

function DashboardContent() {
  const { items, vaults } = useVaultStore();
  const breakdown = calculateSecurityScore(items);

  const getVaultWarnings = (vaultId: string) =>
    items.filter((i) => i.vaultId === vaultId && i.riskStatus !== "secure").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-400">Your family security overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/vaults" className="btn-secondary text-xs">Add Account</Link>
          <Link href="/detox" className="btn-primary text-xs">Start Password Detox</Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SecurityScoreCard breakdown={breakdown} />
        <PasswordDetoxCard items={items} />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Your Vaults</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vaults.map((vault) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              items={items}
              warnings={getVaultWarnings(vault.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/vaults", label: "Add Account", icon: "➕" },
            { href: "/vaults", label: "Generate Password", icon: "🔑" },
            { href: "/detox", label: "Password Detox", icon: "🔄" },
            { href: "/vaults", label: "Secure Note", icon: "📝" },
            { href: "/vaults", label: "Recovery Codes", icon: "🔐" },
            { href: "/backup", label: "Export Backup", icon: "💾" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="card flex flex-col items-center gap-2 py-4 hover:border-emerald-500/50 transition text-center"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs text-slate-300">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
