import { RISK_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { RiskStatus } from "@/types";

const LABELS: Record<RiskStatus, string> = {
  secure: "Secure",
  weak_password: "Weak",
  reused_password: "Reused",
  needs_2fa: "Needs 2FA",
  needs_passkey: "Needs Passkey",
  old_password: "Old",
};

export function RiskBadge({ status }: { status: RiskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        RISK_COLORS[status] ?? RISK_COLORS.secure
      )}
    >
      {LABELS[status]}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const label = category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300">
      {label}
    </span>
  );
}

export function ImportanceBadge({ importance }: { importance: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400",
    high: "bg-orange-500/20 text-orange-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    low: "bg-slate-500/20 text-slate-400",
  };
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize", colors[importance])}>
      {importance}
    </span>
  );
}
