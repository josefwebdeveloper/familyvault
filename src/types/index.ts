export type VaultType = "personal" | "family" | "developer" | "emergency";

export type ItemCategory =
  | "login"
  | "bank"
  | "email"
  | "developer"
  | "cloud"
  | "social"
  | "shopping"
  | "government"
  | "health"
  | "insurance"
  | "wifi"
  | "secure_note"
  | "recovery_codes"
  | "document"
  | "crypto"
  | "home"
  | "car"
  | "school_kids"
  | "subscription"
  | "other";

export type OwnerLabel = "Iosif" | "Elena" | "Family" | "Other";

export type Importance = "critical" | "high" | "medium" | "low";

export type RiskStatus =
  | "weak_password"
  | "reused_password"
  | "secure"
  | "needs_2fa"
  | "needs_passkey"
  | "old_password";

export type TriState = "yes" | "no" | "unknown";
export type PasskeyState = "yes" | "no" | "not_supported" | "unknown";

export interface SecurityChecklist {
  twoFactorEnabled: TriState;
  passkeyEnabled: PasskeyState;
  recoveryEmailChecked: TriState;
  recoveryPhoneChecked: TriState;
  backupCodesSaved: TriState;
}

export interface CryptoSettings {
  kdf: "PBKDF2";
  iterations: number;
  hash: "SHA-256";
  saltBase64: string;
  encryptedUserVaultKeyBase64: string;
  ivBase64: string;
  version: number;
}

export interface UserSettings {
  autoLockMinutes: number;
  language: "en" | "ru" | "he";
  theme: "system" | "light" | "dark";
}

export interface UserProfile {
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  updatedAt: string;
  crypto: CryptoSettings;
  settings: UserSettings;
}

export interface Vault {
  id: string;
  name: string;
  type: VaultType;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  memberIds: string[];
  simpleSharingMode: boolean;
}

export interface VaultMember {
  role: "owner" | "admin" | "member" | "viewer";
  email: string;
  joinedAt: string;
  encryptedVaultKeyBase64?: string;
  status: "active" | "pending" | "removed";
}

export interface VaultItemMetadata {
  id: string;
  vaultId: string;
  title: string;
  url: string;
  username: string;
  category: ItemCategory;
  ownerLabel: OwnerLabel;
  importance: Importance;
  riskStatus: RiskStatus;
  securityChecklist: SecurityChecklist;
  encryptedPayloadBase64: string;
  ivBase64: string;
  createdAt: string;
  updatedAt: string;
  passwordChangedAt?: string;
  deletedAt?: string;
}

export interface ItemSecretPayload {
  password: string;
  notes: string;
  backupCodes: string;
  twoFactorSecret?: string;
  securityQuestions?: Record<string, string>;
  customFields?: Record<string, string>;
  documentRefs?: string[];
}

export interface DecryptedVaultItem extends VaultItemMetadata {
  secrets: ItemSecretPayload;
}

export interface PasswordGeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  avoidConfusing: boolean;
  memorable: boolean;
}

export interface SecurityScoreBreakdown {
  score: number;
  reusedGroups: number;
  weakPasswords: number;
  missing2FA: number;
  missingPasskey: number;
  oldPasswords: number;
  criticalIssues: number;
  missingBackupCodes: number;
  totalItems: number;
}

export interface ReuseGroup {
  id: string;
  itemIds: string[];
  pattern: "exact" | "normalized" | "prefix_suffix" | "similar_pattern";
}

export interface BackupData {
  version: number;
  exportedAt: string;
  userId: string;
  vaults: Vault[];
  items: VaultItemMetadata[];
  crypto: CryptoSettings;
}

export const DEFAULT_VAULTS: { name: string; type: VaultType }[] = [
  { name: "Personal Vault", type: "personal" },
  { name: "Family Vault", type: "family" },
  { name: "Developer Vault", type: "developer" },
  { name: "Emergency Vault", type: "emergency" },
];

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  login: "Login",
  bank: "Bank",
  email: "Email",
  developer: "Developer",
  cloud: "Cloud",
  social: "Social",
  shopping: "Shopping",
  government: "Government",
  health: "Health",
  insurance: "Insurance",
  wifi: "Wi-Fi",
  secure_note: "Secure Note",
  recovery_codes: "Recovery Codes",
  document: "Document",
  crypto: "Crypto",
  home: "Home",
  car: "Car",
  school_kids: "School/Kids",
  subscription: "Subscription",
  other: "Other",
};

export const DETOX_PRIORITY_ACCOUNTS = [
  { title: "Google / Gmail", category: "email" as ItemCategory, importance: "critical" as Importance },
  { title: "Apple ID", category: "login" as ItemCategory, importance: "critical" as Importance },
  { title: "Primary Bank", category: "bank" as ItemCategory, importance: "critical" as Importance },
  { title: "PayPal", category: "bank" as ItemCategory, importance: "critical" as Importance },
  { title: "GitHub", category: "developer" as ItemCategory, importance: "critical" as Importance },
  { title: "Vercel", category: "developer" as ItemCategory, importance: "high" as Importance },
  { title: "Firebase / Google Cloud", category: "cloud" as ItemCategory, importance: "high" as Importance },
  { title: "Facebook / Instagram", category: "social" as ItemCategory, importance: "high" as Importance },
  { title: "Amazon", category: "shopping" as ItemCategory, importance: "high" as Importance },
  { title: "Netflix / Subscriptions", category: "subscription" as ItemCategory, importance: "medium" as Importance },
];
