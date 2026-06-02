"use client";

import type { SecurityScoreBreakdown } from "@/types";
import { cn } from "@/lib/utils";

interface SecurityScoreCardProps {
  breakdown: SecurityScoreBreakdown;
  compact?: boolean;
}

export function SecurityScoreCard({ breakdown, compact = false }: SecurityScoreCardProps) {
  const { score } = breakdown;

  const scoreColor =
    score >= 80 ? "text-emerald-400" :
    score >= 60 ? "text-yellow-400" :
    score >= 40 ? "text-orange-400" : "text-red-400";

  const ringColor =
    score >= 80 ? "stroke-emerald-500" :
    score >= 60 ? "stroke-yellow-500" :
    score >= 40 ? "stroke-orange-500" : "stroke-red-500";

  return (
    <div className={cn("rounded-xl border border-slate-700 bg-slate-800/50 p-5", compact && "p-4")}>
      <h3 className="text-sm font-medium text-slate-400 mb-4">Security Score</h3>

      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              className={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${score * 2.64} 264`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-2xl font-bold", scoreColor)}>{score}</span>
          </div>
        </div>

        {!compact && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm flex-1">
            <Stat label="Reused groups" value={breakdown.reusedGroups} warn={breakdown.reusedGroups > 0} />
            <Stat label="Weak passwords" value={breakdown.weakPasswords} warn={breakdown.weakPasswords > 0} />
            <Stat label="Missing 2FA" value={breakdown.missing2FA} warn={breakdown.missing2FA > 0} />
            <Stat label="Old passwords" value={breakdown.oldPasswords} warn={breakdown.oldPasswords > 0} />
            <Stat label="Critical issues" value={breakdown.criticalIssues} warn={breakdown.criticalIssues > 0} />
            <Stat label="Total items" value={breakdown.totalItems} />
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={warn ? "text-orange-400 font-medium" : "text-slate-200"}>{value}</span>
    </div>
  );
}
