import { describe, it, expect } from "vitest";
import {
  calculateSecurityScore,
  detectReuseGroups,
  isWeakPassword,
  isOldPassword,
} from "@/lib/security/analysis";
import type { DecryptedVaultItem } from "@/types";

function makeItem(overrides: Partial<DecryptedVaultItem> & { id: string; password: string }): DecryptedVaultItem {
  return {
    vaultId: "v1",
    title: overrides.title ?? "Test Account",
    url: "",
    username: "",
    category: "login",
    ownerLabel: "Family",
    importance: "medium",
    riskStatus: "secure",
    securityChecklist: {
      twoFactorEnabled: "yes",
      passkeyEnabled: "unknown",
      recoveryEmailChecked: "unknown",
      recoveryPhoneChecked: "unknown",
      backupCodesSaved: "yes",
    },
    encryptedPayloadBase64: "",
    ivBase64: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    secrets: {
      password: overrides.password,
      notes: "",
      backupCodes: "",
    },
    ...overrides,
  };
}

describe("reuse detection", () => {
  it("detects exact password reuse", () => {
    const items = [
      makeItem({ id: "1", password: "SamePassword123!" }),
      makeItem({ id: "2", password: "SamePassword123!", title: "Other" }),
    ];
    const groups = detectReuseGroups(items);
    expect(groups.length).toBe(1);
    expect(groups[0].itemIds).toHaveLength(2);
    expect(groups[0].pattern).toBe("exact");
  });

  it("detects no reuse for unique passwords", () => {
    const items = [
      makeItem({ id: "1", password: "Alpha#9xK!mN2pQ" }),
      makeItem({ id: "2", password: "Beta@7wL$jR4vH8z" }),
    ];
    const groups = detectReuseGroups(items);
    expect(groups.length).toBe(0);
  });
});

describe("security scoring", () => {
  it("gives high score for secure items", () => {
    const items = [
      makeItem({
        id: "1",
        password: "Str0ng!Unique#Pass2024",
        passwordChangedAt: new Date().toISOString(),
      }),
    ];
    const score = calculateSecurityScore(items);
    expect(score.score).toBeGreaterThan(70);
  });

  it("deducts for weak and reused passwords", () => {
    const items = [
      makeItem({ id: "1", password: "123", importance: "critical" }),
      makeItem({ id: "2", password: "123", title: "Bank", importance: "critical" }),
    ];
    const score = calculateSecurityScore(items);
    expect(score.score).toBeLessThan(50);
    expect(score.reusedGroups).toBeGreaterThan(0);
    expect(score.weakPasswords).toBeGreaterThan(0);
  });
});

describe("password analysis helpers", () => {
  it("identifies weak passwords", () => {
    expect(isWeakPassword("short")).toBe(true);
    expect(isWeakPassword("nouppercaseornumbers")).toBe(true);
    expect(isWeakPassword("Str0ng!Pass2024")).toBe(false);
  });

  it("identifies old passwords", () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 2);
    expect(isOldPassword(old.toISOString())).toBe(true);
    expect(isOldPassword(new Date().toISOString())).toBe(false);
    expect(isOldPassword(undefined)).toBe(true);
  });
});
