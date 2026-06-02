import { describe, it, expect } from "vitest";
import { itemFormSchema, masterPasswordSchema } from "@/lib/validation/schemas";

describe("item validation", () => {
  it("validates a complete item form", () => {
    const result = itemFormSchema.safeParse({
      title: "Gmail",
      url: "https://mail.google.com",
      username: "user@gmail.com",
      category: "email",
      vaultId: "vault123",
      ownerLabel: "Family",
      importance: "critical",
      password: "Str0ng!Pass",
      notes: "",
      backupCodes: "",
      twoFactorEnabled: "yes",
      passkeyEnabled: "unknown",
      recoveryEmailChecked: "yes",
      recoveryPhoneChecked: "no",
      backupCodesSaved: "yes",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = itemFormSchema.safeParse({
      title: "",
      category: "login",
      vaultId: "v1",
      ownerLabel: "Family",
      importance: "medium",
      twoFactorEnabled: "unknown",
      passkeyEnabled: "unknown",
      recoveryEmailChecked: "unknown",
      recoveryPhoneChecked: "unknown",
      backupCodesSaved: "unknown",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty URL", () => {
    const result = itemFormSchema.safeParse({
      title: "Note",
      url: "",
      category: "secure_note",
      vaultId: "v1",
      ownerLabel: "Family",
      importance: "low",
      twoFactorEnabled: "unknown",
      passkeyEnabled: "unknown",
      recoveryEmailChecked: "unknown",
      recoveryPhoneChecked: "unknown",
      backupCodesSaved: "unknown",
    });
    expect(result.success).toBe(true);
  });
});

describe("master password validation", () => {
  it("requires matching passwords", () => {
    const result = masterPasswordSchema.safeParse({
      password: "long-enough-password",
      confirmPassword: "different-password",
    });
    expect(result.success).toBe(false);
  });

  it("requires minimum length", () => {
    const result = masterPasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid master password", () => {
    const result = masterPasswordSchema.safeParse({
      password: "my-secure-master-password",
      confirmPassword: "my-secure-master-password",
    });
    expect(result.success).toBe(true);
  });
});
