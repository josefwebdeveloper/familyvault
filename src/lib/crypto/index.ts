/**
 * Client-side encryption using Web Crypto API.
 * PBKDF2 + AES-GCM for MVP. Architecture allows swapping KDF to Argon2id later.
 */

export const PBKDF2_ITERATIONS = 310_000;
export const VAULT_KEY_LENGTH = 32;
export const SALT_LENGTH = 16;
export const IV_LENGTH = 12;

export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export function generateVaultKey(): Uint8Array {
  return generateRandomBytes(VAULT_KEY_LENGTH);
}

export async function importVaultKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(rawKey),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptJson(
  payload: unknown,
  key: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  const iv = generateRandomBytes(IV_LENGTH);
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    data
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptJson<T>(
  encryptedBase64: string,
  key: CryptoKey,
  ivBase64: string
): Promise<T> {
  const encrypted = base64ToArrayBuffer(encryptedBase64);
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted)) as T;
}

export async function encryptVaultKey(
  vaultKey: Uint8Array,
  derivedKey: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  const iv = generateRandomBytes(IV_LENGTH);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    derivedKey,
    new Uint8Array(vaultKey)
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptVaultKey(
  encryptedVaultKeyBase64: string,
  derivedKey: CryptoKey,
  ivBase64: string
): Promise<Uint8Array> {
  const encrypted = base64ToArrayBuffer(encryptedVaultKeyBase64);
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    encrypted
  );

  return new Uint8Array(decrypted);
}

const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghjkmnpqrstuvwxyz";
const NUMBERS = "23456789";
const SYMBOLS = "!@#$%^&*-_=+";
const CONFUSING = "0O1lI";

export interface PasswordGenOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  avoidConfusing: boolean;
  memorable: boolean;
}

export function generatePassword(options: PasswordGenOptions): string {
  if (options.memorable) {
    return generateMemorablePassword(options.length);
  }

  let charset = "";
  if (options.uppercase) charset += UPPERCASE;
  if (options.lowercase) charset += LOWERCASE;
  if (options.numbers) charset += NUMBERS;
  if (options.symbols) charset += SYMBOLS;

  if (options.avoidConfusing) {
    charset = charset
      .split("")
      .filter((c) => !CONFUSING.includes(c))
      .join("");
  }

  if (!charset) {
    charset = LOWERCASE + NUMBERS;
  }

  const required: string[] = [];
  if (options.uppercase) required.push(pickRandom(UPPERCASE));
  if (options.lowercase) required.push(pickRandom(LOWERCASE));
  if (options.numbers) required.push(pickRandom(NUMBERS));
  if (options.symbols) required.push(pickRandom(SYMBOLS));

  const remaining = options.length - required.length;
  const chars: string[] = [...required];
  for (let i = 0; i < remaining; i++) {
    chars.push(pickRandom(charset));
  }

  return shuffleArray(chars).join("");
}

function pickRandom(charset: string): string {
  const bytes = generateRandomBytes(1);
  return charset[bytes[0] % charset.length];
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = generateRandomBytes(1)[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const WORDS = [
  "apple", "river", "cloud", "stone", "light", "forest", "ocean", "mountain",
  "silver", "golden", "brave", "quiet", "swift", "gentle", "bright", "calm",
];

function generateMemorablePassword(length: number): string {
  const wordCount = Math.max(3, Math.floor(length / 6));
  const parts: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const word = WORDS[generateRandomBytes(1)[0] % WORDS.length];
    parts.push(i % 2 === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1));
  }
  parts.push(String(generateRandomBytes(1)[0] % 90 + 10));
  parts.push(SYMBOLS[generateRandomBytes(1)[0] % SYMBOLS.length]);
  return parts.join("-");
}

export function assessPasswordStrength(password: string): {
  score: number;
  label: "weak" | "fair" | "good" | "strong";
} {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  const labels: Array<"weak" | "fair" | "good" | "strong"> = ["weak", "fair", "good", "strong"];
  const labelIndex = Math.min(Math.floor(score / 2), 3);

  return { score: Math.min(score * 12.5, 100), label: labels[labelIndex] };
}
