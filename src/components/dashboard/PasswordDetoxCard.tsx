"use client";

import Link from "next/link";
import type { DecryptedVaultItem } from "@/types";
import { getTodaysPlan } from "@/lib/security/analysis";

interface PasswordDetoxCardProps {
  items: DecryptedVaultItem[];
}

export function PasswordDetoxCard({ items }: PasswordDetoxCardProps) {
  const plan = getTodaysPlan(items);
  const fixedCount = items.filter((i) => i.riskStatus === "secure").length;
  const totalAtRisk = items.length - fixedCount;
  const progress = items.length ? Math.round((fixedCount / items.length) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400">Password Detox Progress</h3>
        <Link
          href="/detox"
          className="text-xs text-emerald-400 hover:text-emerald-300 transition"
        >
          Start Detox →
        </Link>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-300">{fixedCount} secured</span>
          <span className="text-slate-400">{totalAtRisk} remaining</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <PlanSection
          title="Fix 3 critical today"
          items={plan.criticalToday}
          emptyText="No critical accounts need fixing"
        />
        <PlanSection
          title="Fix 5 high priority this week"
          items={plan.highThisWeek}
          emptyText="No high priority accounts"
        />
      </div>
    </div>
  );
}

function PlanSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: DecryptedVaultItem[];
  emptyText: string;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-emerald-400/70">{emptyText}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-slate-300">
              <span className="text-orange-400">○</span>
              {item.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
