"use client";

import {
  decryptJson,
  encryptJson,
  importVaultKey,
} from "@/lib/crypto";
import type {
  VaultItemMetadata,
  ItemSecretPayload,
  DecryptedVaultItem,
} from "@/types";
import {
  detectReuseGroups,
  computeRiskStatus,
} from "@/lib/security/analysis";

export async function decryptVaultItem(
  metadata: VaultItemMetadata,
  vaultKey: CryptoKey
): Promise<DecryptedVaultItem> {
  const secrets = await decryptJson<ItemSecretPayload>(
    metadata.encryptedPayloadBase64,
    vaultKey,
    metadata.ivBase64
  );
  return { ...metadata, secrets };
}

export async function decryptAllItems(
  items: VaultItemMetadata[],
  vaultKey: CryptoKey
): Promise<DecryptedVaultItem[]> {
  const decrypted: DecryptedVaultItem[] = [];
  for (const item of items) {
    try {
      const d = await decryptVaultItem(item, vaultKey);
      decrypted.push(d);
    } catch {
      // Skip items that fail to decrypt
    }
  }

  const reuseGroups = detectReuseGroups(decrypted);
  return decrypted.map((item) => ({
    ...item,
    riskStatus: computeRiskStatus(item, reuseGroups),
  }));
}

export async function encryptItemSecrets(
  secrets: ItemSecretPayload,
  vaultKey: CryptoKey
): Promise<{ encryptedPayloadBase64: string; ivBase64: string }> {
  const { encrypted, iv } = await encryptJson(secrets, vaultKey);
  return { encryptedPayloadBase64: encrypted, ivBase64: iv };
}

export async function unlockVaultWithPassword(
  masterPassword: string,
  cryptoSettings: {
    saltBase64: string;
    iterations: number;
    encryptedUserVaultKeyBase64: string;
    ivBase64: string;
  }
): Promise<CryptoKey> {
  const { deriveKeyFromPassword, decryptVaultKey, importVaultKey, base64ToArrayBuffer } =
    await import("@/lib/crypto");

  const salt = new Uint8Array(base64ToArrayBuffer(cryptoSettings.saltBase64));
  const derivedKey = await deriveKeyFromPassword(
    masterPassword,
    salt,
    cryptoSettings.iterations
  );

  const rawVaultKey = await decryptVaultKey(
    cryptoSettings.encryptedUserVaultKeyBase64,
    derivedKey,
    cryptoSettings.ivBase64
  );

  return importVaultKey(rawVaultKey);
}

export async function setupVaultEncryption(
  masterPassword: string
): Promise<{
  crypto: {
    kdf: "PBKDF2";
    iterations: number;
    hash: "SHA-256";
    saltBase64: string;
    encryptedUserVaultKeyBase64: string;
    ivBase64: string;
    version: number;
  };
  vaultKey: CryptoKey;
}> {
  const {
    generateRandomBytes,
    arrayBufferToBase64,
    deriveKeyFromPassword,
    generateVaultKey,
    encryptVaultKey,
    importVaultKey,
    PBKDF2_ITERATIONS,
  } = await import("@/lib/crypto");

  const salt = generateRandomBytes(16);
  const derivedKey = await deriveKeyFromPassword(masterPassword, salt);
  const rawVaultKey = generateVaultKey();
  const { encrypted, iv } = await encryptVaultKey(rawVaultKey, derivedKey);
  const vaultKey = await importVaultKey(rawVaultKey);

  return {
    crypto: {
      kdf: "PBKDF2",
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
      saltBase64: arrayBufferToBase64(salt),
      encryptedUserVaultKeyBase64: encrypted,
      ivBase64: iv,
      version: 1,
    },
    vaultKey,
  };
}
