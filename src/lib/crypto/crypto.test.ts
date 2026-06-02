import { describe, it, expect } from "vitest";
import {
  generateRandomBytes,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  deriveKeyFromPassword,
  generateVaultKey,
  encryptJson,
  decryptJson,
  encryptVaultKey,
  decryptVaultKey,
  importVaultKey,
  generatePassword,
  assessPasswordStrength,
  PBKDF2_ITERATIONS,
} from "@/lib/crypto";

describe("crypto roundtrip", () => {
  it("encrypts and decrypts JSON payload", async () => {
    const vaultKeyRaw = generateVaultKey();
    const vaultKey = await importVaultKey(vaultKeyRaw);

    const payload = { password: "secret123!", notes: "test note", backupCodes: "abc-def" };
    const { encrypted, iv } = await encryptJson(payload, vaultKey);
    const decrypted = await decryptJson<typeof payload>(encrypted, vaultKey, iv);

    expect(decrypted).toEqual(payload);
  });

  it("encrypts and decrypts vault key with derived key", async () => {
    const salt = generateRandomBytes(16);
    const derivedKey = await deriveKeyFromPassword("test-master-password-123", salt);
    const vaultKeyRaw = generateVaultKey();

    const { encrypted, iv } = await encryptVaultKey(vaultKeyRaw, derivedKey);
    const decryptedRaw = await decryptVaultKey(encrypted, derivedKey, iv);

    expect(arrayBufferToBase64(decryptedRaw.buffer)).toBe(
      arrayBufferToBase64(vaultKeyRaw.buffer)
    );
  });

  it("wrong password cannot decrypt vault key", async () => {
    const salt = generateRandomBytes(16);
    const correctKey = await deriveKeyFromPassword("correct-password-here", salt);
    const wrongKey = await deriveKeyFromPassword("wrong-password-here!", salt);
    const vaultKeyRaw = generateVaultKey();

    const { encrypted, iv } = await encryptVaultKey(vaultKeyRaw, correctKey);

    await expect(decryptVaultKey(encrypted, wrongKey, iv)).rejects.toThrow();
  });

  it("base64 encoding roundtrips", () => {
    const original = generateRandomBytes(32);
    const encoded = arrayBufferToBase64(original.buffer);
    const decoded = new Uint8Array(base64ToArrayBuffer(encoded));
    expect(decoded).toEqual(original);
  });
});

describe("password generator", () => {
  it("generates password of requested length", () => {
    const pw = generatePassword({
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      avoidConfusing: true,
      memorable: false,
    });
    expect(pw.length).toBe(20);
  });

  it("includes required character types", () => {
    const pw = generatePassword({
      length: 24,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      avoidConfusing: false,
      memorable: false,
    });
    expect(/[A-Z]/.test(pw)).toBe(true);
    expect(/[a-z]/.test(pw)).toBe(true);
    expect(/[0-9]/.test(pw)).toBe(true);
    expect(/[^a-zA-Z0-9]/.test(pw)).toBe(true);
  });

  it("generates memorable passwords with dashes", () => {
    const pw = generatePassword({
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      avoidConfusing: true,
      memorable: true,
    });
    expect(pw).toContain("-");
  });
});

describe("password strength", () => {
  it("rates weak passwords correctly", () => {
    const result = assessPasswordStrength("123");
    expect(result.label).toBe("weak");
  });

  it("rates strong passwords correctly", () => {
    const result = assessPasswordStrength("Xk9#mP2$vL8@nQ4!wR6");
    expect(["good", "strong"]).toContain(result.label);
  });
});

describe("KDF settings", () => {
  it("uses recommended PBKDF2 iteration count", () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(310_000);
  });
});
