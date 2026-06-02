import type {
  DecryptedVaultItem,
  SecurityScoreBreakdown,
  ReuseGroup,
  RiskStatus,
  Importance,
} from "@/types";

const OLD_PASSWORD_DAYS = 365;

function normalizePassword(password: string): string {
  return password.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(a.length, b.length);
  return 1 - matrix[a.length][b.length] / maxLen;
}

function hasPrefixSuffixPattern(a: string, b: string): boolean {
  if (a.length < 4 || b.length < 4) return false;
  const minLen = Math.min(a.length, b.length);
  const prefixMatch = a.slice(0, 4) === b.slice(0, 4);
  const suffixMatch = a.slice(-4) === b.slice(-4);
  const lengthSimilar = Math.abs(a.length - b.length) <= 3;
  return (prefixMatch || suffixMatch) && lengthSimilar && a !== b;
}

export function detectReuseGroups(items: DecryptedVaultItem[]): ReuseGroup[] {
  const groups: ReuseGroup[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    if (visited.has(items[i].id)) continue;
    const pwA = items[i].secrets.password;
    if (!pwA) continue;

    const groupIds = [items[i].id];
    let pattern: ReuseGroup["pattern"] = "exact";

    for (let j = i + 1; j < items.length; j++) {
      const pwB = items[j].secrets.password;
      if (!pwB) continue;

      if (pwA === pwB) {
        groupIds.push(items[j].id);
        pattern = "exact";
      } else if (normalizePassword(pwA) === normalizePassword(pwB) && normalizePassword(pwA).length > 0) {
        groupIds.push(items[j].id);
        pattern = "normalized";
      } else if (hasPrefixSuffixPattern(pwA, pwB)) {
        groupIds.push(items[j].id);
        pattern = "prefix_suffix";
      } else if (levenshteinSimilarity(pwA, pwB) > 0.75 && pwA.length > 6) {
        groupIds.push(items[j].id);
        pattern = "similar_pattern";
      }
    }

    if (groupIds.length > 1) {
      groupIds.forEach((id) => visited.add(id));
      groups.push({
        id: `group-${items[i].id}`,
        itemIds: groupIds,
        pattern,
      });
    }
  }

  return groups;
}

export function isWeakPassword(password: string): boolean {
  if (!password) return true;
  if (password.length < 10) return true;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const variety = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  return variety < 3;
}

export function isOldPassword(changedAt?: string): boolean {
  if (!changedAt) return true;
  const changed = new Date(changedAt);
  const daysSince = (Date.now() - changed.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > OLD_PASSWORD_DAYS;
}

export function computeRiskStatus(
  item: DecryptedVaultItem,
  reuseGroups: ReuseGroup[]
): RiskStatus {
  const password = item.secrets.password;
  const inReuseGroup = reuseGroups.some((g) => g.itemIds.includes(item.id));

  if (inReuseGroup) return "reused_password";
  if (isWeakPassword(password)) return "weak_password";
  if (isOldPassword(item.passwordChangedAt)) return "old_password";
  if (item.securityChecklist.twoFactorEnabled === "no") return "needs_2fa";
  if (item.securityChecklist.passkeyEnabled === "no") return "needs_passkey";
  return "secure";
}

export function calculateSecurityScore(items: DecryptedVaultItem[]): SecurityScoreBreakdown {
  const reuseGroups = detectReuseGroups(items);
  const reusedItemIds = new Set(reuseGroups.flatMap((g) => g.itemIds));

  let weakPasswords = 0;
  let missing2FA = 0;
  let missingPasskey = 0;
  let oldPasswords = 0;
  let criticalIssues = 0;
  let missingBackupCodes = 0;

  for (const item of items) {
    if (isWeakPassword(item.secrets.password)) weakPasswords++;
    if (item.securityChecklist.twoFactorEnabled !== "yes") missing2FA++;
    if (item.securityChecklist.passkeyEnabled === "no") missingPasskey++;
    if (isOldPassword(item.passwordChangedAt)) oldPasswords++;
    if (item.securityChecklist.backupCodesSaved !== "yes") missingBackupCodes++;

    const isCritical =
      item.importance === "critical" &&
      (reusedItemIds.has(item.id) ||
        isWeakPassword(item.secrets.password) ||
        item.securityChecklist.twoFactorEnabled === "no");
    if (isCritical) criticalIssues++;
  }

  const totalItems = items.length || 1;
  const maxDeductions = 100;
  const deductions =
    (reusedItemIds.size / totalItems) * 30 +
    (weakPasswords / totalItems) * 20 +
    (missing2FA / totalItems) * 15 +
    (missingPasskey / totalItems) * 5 +
    (oldPasswords / totalItems) * 10 +
    (criticalIssues / totalItems) * 15 +
    (missingBackupCodes / totalItems) * 5;

  const score = Math.max(0, Math.round(maxDeductions - deductions));

  return {
    score,
    reusedGroups: reuseGroups.length,
    weakPasswords,
    missing2FA,
    missingPasskey,
    oldPasswords,
    criticalIssues,
    missingBackupCodes,
    totalItems: items.length,
  };
}

export function getDetoxRecommendations(items: DecryptedVaultItem[]): DecryptedVaultItem[] {
  const reuseGroups = detectReuseGroups(items);
  const reusedIds = new Set(reuseGroups.flatMap((g) => g.itemIds));

  const importanceOrder: Record<Importance, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return items
    .filter(
      (item) =>
        reusedIds.has(item.id) ||
        isWeakPassword(item.secrets.password) ||
        item.riskStatus !== "secure"
    )
    .sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);
}

export function getTodaysPlan(items: DecryptedVaultItem[]): {
  criticalToday: DecryptedVaultItem[];
  highThisWeek: DecryptedVaultItem[];
  remaining: DecryptedVaultItem[];
} {
  const recommendations = getDetoxRecommendations(items);
  const criticalToday = recommendations.filter((i) => i.importance === "critical").slice(0, 3);
  const highThisWeek = recommendations
    .filter((i) => i.importance === "high" && !criticalToday.find((c) => c.id === i.id))
    .slice(0, 5);
  const usedIds = new Set([
    ...criticalToday.map((i) => i.id),
    ...highThisWeek.map((i) => i.id),
  ]);
  const remaining = recommendations.filter((i) => !usedIds.has(i.id));

  return { criticalToday, highThisWeek, remaining };
}
