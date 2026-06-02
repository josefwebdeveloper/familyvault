import { z } from "zod";

export const itemFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  url: z.string().url("Invalid URL").or(z.literal("")).optional(),
  username: z.string().max(200).optional(),
  category: z.string().min(1),
  vaultId: z.string().min(1),
  ownerLabel: z.enum(["Iosif", "Elena", "Family", "Other"]),
  importance: z.enum(["critical", "high", "medium", "low"]),
  password: z.string().optional(),
  notes: z.string().max(10000).optional(),
  backupCodes: z.string().max(5000).optional(),
  twoFactorEnabled: z.enum(["yes", "no", "unknown"]),
  passkeyEnabled: z.enum(["yes", "no", "not_supported", "unknown"]),
  recoveryEmailChecked: z.enum(["yes", "no", "unknown"]),
  recoveryPhoneChecked: z.enum(["yes", "no", "unknown"]),
  backupCodesSaved: z.enum(["yes", "no", "unknown"]),
  passwordChangedAt: z.string().optional(),
  remindRotation: z.boolean().optional(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const masterPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Master password must be at least 12 characters")
      .max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const backupSchema = z.object({
  version: z.number(),
  exportedAt: z.string(),
  userId: z.string(),
  vaults: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(["personal", "family", "developer", "emergency"]),
    ownerId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    memberIds: z.array(z.string()),
    simpleSharingMode: z.boolean(),
  })),
  items: z.array(z.object({
    id: z.string(),
    vaultId: z.string(),
    title: z.string(),
    encryptedPayloadBase64: z.string(),
    ivBase64: z.string(),
  }).passthrough()),
  crypto: z.object({
    kdf: z.literal("PBKDF2"),
    iterations: z.number(),
    hash: z.literal("SHA-256"),
    saltBase64: z.string(),
    encryptedUserVaultKeyBase64: z.string(),
    ivBase64: z.string(),
    version: z.number(),
  }),
});

export type BackupSchema = z.infer<typeof backupSchema>;
