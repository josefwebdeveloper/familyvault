"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { UnlockedGuard } from "@/components/providers/VaultGuard";
import { SecurityScoreCard } from "@/components/dashboard/SecurityScoreCard";
import { RiskBadge } from "@/components/ui/Badges";
import { useVaultStore } from "@/stores/vault-store";
import {
  calculateSecurityScore,
  detectReuseGroups,
  isWeakPassword,
  isOldPassword,
} from "@/lib/security/analysis";

export default function SecurityPage() {
  return (
    <UnlockedGuard>
      <AppShell>
        <SecurityContent />
      </AppShell>
    </UnlockedGuard>
  );
}

function SecurityContent() {
  const { items } = useVaultStore();
  const breakdown = useMemo(() => calculateSecurityScore(items), [items]);
  const reuseGroups = useMemo(() => detectReuseGroups(items), [items]);

  const weakItems = items.filter((i) => isWeakPassword(i.secrets.password));
  const no2FA = items.filter((i) => i.securityChecklist.twoFactorEnabled !== "yes");
  const noPasskey = items.filter((i) => i.securityChecklist.passkeyEnabled === "no");
  const oldItems = items.filter((i) => isOldPassword(i.passwordChangedAt));
  const noBackup = items.filter((i) => i.securityChecklist.backupCodesSaved !== "yes");
  const criticalIssues = items.filter(
    (i) => i.importance === "critical" && i.riskStatus !== "secure"
  );
  const noUrl = items.filter((i) => !i.url);
  const noOwner = items.filter((i) => !i.ownerLabel);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Security Health</h1>
        <p className="text-sm text-slate-400">
          All analysis runs locally on your device. Passwords never leave your browser.
        </p>
      </div>

      <SecurityScoreCard breakdown={breakdown} />

      <IssueSection
        title="Reused / Similar Password Groups"
        count={reuseGroups.length}
        empty="No reused passwords detected"
      >
        {reuseGroups.map((group) => (
          <div key={group.id} className="bg-slate-900/50 rounded-lg p-3 mb-2">
            <p className="text-xs text-orange-400 mb-1 capitalize">{group.pattern.replace(/_/g, " ")} match</p>
            <ul className="text-sm text-slate-300">
              {group.itemIds.map((id) => {
                const item = items.find((i) => i.id === id);
                return item ? <li key={id}>• {item.title}</li> : null;
              })}
            </ul>
          </div>
        ))}
      </IssueSection>

      <IssueSection title="Weak Passwords" count={weakItems.length} empty="No weak passwords">
        <ItemList items={weakItems} />
      </IssueSection>

      <IssueSection title="Missing 2FA" count={no2FA.length} empty="All accounts have 2FA">
        <ItemList items={no2FA} />
      </IssueSection>

      <IssueSection title="Missing Passkey" count={noPasskey.length} empty="No passkey issues">
        <ItemList items={noPasskey} />
      </IssueSection>

      <IssueSection title="Critical Account Issues" count={criticalIssues.length} empty="Critical accounts secured">
        <ItemList items={criticalIssues} />
      </IssueSection>

      <IssueSection title="Old Passwords (>1 year)" count={oldItems.length} empty="No old passwords">
        <ItemList items={oldItems} />
      </IssueSection>

      <IssueSection title="Missing Backup Codes" count={noBackup.length} empty="Backup codes saved">
        <ItemList items={noBackup} />
      </IssueSection>

      <IssueSection title="Missing URL" count={noUrl.length} empty="All items have URLs">
        <ItemList items={noUrl} />
      </IssueSection>

      <IssueSection title="Missing Owner" count={noOwner.length} empty="All items have owners">
        <ItemList items={noOwner} />
      </IssueSection>
    </div>
  );
}

function IssueSection({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-slate-200">{title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${count > 0 ? "bg-orange-500/20 text-orange-400" : "bg-emerald-500/20 text-emerald-400"}`}>
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-emerald-400/70">{empty}</p>
      ) : (
        children
      )}
    </div>
  );
}

function ItemList({ items }: { items: { id: string; title: string; riskStatus: import("@/types").RiskStatus }[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between text-sm">
          <span className="text-slate-300">{item.title}</span>
          <RiskBadge status={item.riskStatus} />
        </li>
      ))}
    </ul>
  );
}
