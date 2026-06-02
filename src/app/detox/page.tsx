"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { UnlockedGuard } from "@/components/providers/VaultGuard";
import { PasswordGenerator } from "@/components/PasswordGenerator";
import { Checklist } from "@/components/vault/ItemViews";
import { RiskBadge, ImportanceBadge } from "@/components/ui/Badges";
import { useVaultStore } from "@/stores/vault-store";
import { getDetoxRecommendations } from "@/lib/security/analysis";
import { DETOX_PRIORITY_ACCOUNTS } from "@/types";
import type { DecryptedVaultItem } from "@/types";
import { toast } from "@/components/ui/Toast";

export default function DetoxPage() {
  return (
    <UnlockedGuard>
      <AppShell>
        <DetoxContent />
      </AppShell>
    </UnlockedGuard>
  );
}

function DetoxContent() {
  const { items, updateItem } = useVaultStore();
  const recommendations = useMemo(() => getDetoxRecommendations(items), [items]);
  const [step, setStep] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checklist, setChecklist] = useState<boolean[]>(Array(8).fill(false));
  const [generatedPassword, setGeneratedPassword] = useState("");

  const currentItem = recommendations[currentIndex];
  const priorityAccounts = DETOX_PRIORITY_ACCOUNTS.filter(
    (pa) => !items.some((i) => i.title.toLowerCase().includes(pa.title.toLowerCase().split(" ")[0]))
  );

  const toggleCheck = (index: number) => {
    setChecklist((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const markFixed = () => {
    if (!currentItem) return;
    updateItem({
      ...currentItem,
      riskStatus: "secure",
      securityChecklist: {
        ...currentItem.securityChecklist,
        twoFactorEnabled: checklist[4] ? "yes" : currentItem.securityChecklist.twoFactorEnabled,
        backupCodesSaved: checklist[6] ? "yes" : currentItem.securityChecklist.backupCodesSaved,
      },
      passwordChangedAt: new Date().toISOString(),
    });
    toast("Account marked as fixed!", "success");
    setChecklist(Array(8).fill(false));
    setGeneratedPassword("");
    if (currentIndex < recommendations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStep(3);
    }
  };

  const checklistItems = [
    "Open account security settings",
    "Change password on the website",
    "Paste generated password",
    "Save in FamilyVault",
    "Enable 2FA if available",
    "Add passkey if available",
    "Save backup codes",
    "Mark account as fixed",
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Password Detox</h1>
        <p className="text-sm text-slate-400">
          Fix your most important accounts first — one step at a time.
        </p>
      </div>

      {step === 0 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Why Password Detox?</h2>
          <p className="text-slate-400">
            You currently use similar or repeated passwords across accounts.
            We will fix your most important accounts first, starting with critical services
            like email, banking, and cloud accounts.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-2xl font-bold text-red-400">{recommendations.filter((i) => i.importance === "critical").length}</p>
              <p className="text-xs text-slate-400">Critical</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-2xl font-bold text-orange-400">{recommendations.filter((i) => i.importance === "high").length}</p>
              <p className="text-xs text-slate-400">High Priority</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-2xl font-bold text-slate-300">{items.length}</p>
              <p className="text-xs text-slate-400">Total Accounts</p>
            </div>
          </div>
          <button onClick={() => setStep(1)} className="btn-primary w-full">
            Start Detox
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Priority List</h2>
          <p className="text-sm text-slate-400">These accounts need attention, ordered by importance:</p>

          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🎉</span>
              <p className="text-emerald-400 mt-2">All tracked accounts look secure!</p>
              {priorityAccounts.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-sm text-slate-400 mb-2">Consider adding these critical accounts:</p>
                  <ul className="space-y-1">
                    {priorityAccounts.slice(0, 5).map((a) => (
                      <li key={a.title} className="text-sm text-slate-300">○ {a.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {recommendations.map((item, i) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 cursor-pointer hover:bg-slate-900"
                  onClick={() => { setCurrentIndex(i); setStep(2); }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{i + 1}.</span>
                    <div>
                      <p className="font-medium text-slate-200">{item.title}</p>
                      <div className="flex gap-2 mt-1">
                        <ImportanceBadge importance={item.importance} />
                        <RiskBadge status={item.riskStatus} />
                      </div>
                    </div>
                  </div>
                  <span className="text-emerald-400 text-sm">Fix →</span>
                </li>
              ))}
            </ul>
          )}

          {recommendations.length > 0 && (
            <button onClick={() => { setCurrentIndex(0); setStep(2); }} className="btn-primary w-full">
              Fix First Account
            </button>
          )}
        </div>
      )}

      {step === 2 && currentItem && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500">Account {currentIndex + 1} of {recommendations.length}</p>
                <h2 className="text-lg font-semibold text-slate-100">{currentItem.title}</h2>
              </div>
              <RiskBadge status={currentItem.riskStatus} />
            </div>

            {currentItem.url && (
              <a
                href={currentItem.url.startsWith("http") ? currentItem.url : `https://${currentItem.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex mb-4"
              >
                Open Website ↗
              </a>
            )}

            <h3 className="text-sm font-medium text-slate-400 mb-2">Generate New Password</h3>
            <PasswordGenerator
              onUse={(pw) => setGeneratedPassword(pw)}
            />
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Checklist</h3>
            <ul className="space-y-2">
              {checklistItems.map((label, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checklist[i]}
                    onChange={() => toggleCheck(i)}
                    className="rounded border-slate-600"
                  />
                  <span className={`text-sm ${checklist[i] ? "text-slate-500 line-through" : "text-slate-300"}`}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
            <button
              onClick={markFixed}
              disabled={!checklist[7]}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              Mark as Fixed
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card text-center space-y-4">
          <span className="text-5xl">✅</span>
          <h2 className="text-lg font-semibold text-slate-100">Great Progress!</h2>
          <p className="text-slate-400">
            You have worked through your priority accounts. Keep going with remaining items.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Today&apos;s plan:</p>
            <Checklist items={[
              { label: "Fix 3 critical accounts today", done: recommendations.filter((i) => i.importance === "critical" && i.riskStatus === "secure").length >= 3 },
              { label: "Fix 5 high priority this week", done: false },
              { label: "Fix remaining low priority later", done: false },
            ]} />
          </div>
          <button onClick={() => { setStep(0); setCurrentIndex(0); }} className="btn-primary w-full">
            Back to Detox Home
          </button>
        </div>
      )}
    </div>
  );
}
