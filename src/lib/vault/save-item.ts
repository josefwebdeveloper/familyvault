import { saveVaultItem } from "@/lib/firebase/firestore";
import { encryptItemSecrets } from "@/lib/vault/service";
import { computeRiskStatus, detectReuseGroups } from "@/lib/security/analysis";
import type { DecryptedVaultItem, ItemCategory } from "@/types";
import type { ItemFormData } from "@/components/vault/ItemForm";

export async function saveItemFromForm(
  data: ItemFormData,
  vaultKey: CryptoKey,
  existingItem: DecryptedVaultItem | undefined,
  allItems: DecryptedVaultItem[]
): Promise<DecryptedVaultItem> {
  const secrets = {
    password: data.password,
    notes: data.notes,
    backupCodes: data.backupCodes,
  };

  const { encryptedPayloadBase64, ivBase64 } = await encryptItemSecrets(secrets, vaultKey);
  const now = new Date().toISOString();

  const metadata = {
    title: data.title,
    url: data.url,
    username: data.username,
    category: data.category as ItemCategory,
    ownerLabel: data.ownerLabel,
    importance: data.importance,
    riskStatus: "secure" as const,
    securityChecklist: {
      twoFactorEnabled: data.twoFactorEnabled,
      passkeyEnabled: data.passkeyEnabled,
      recoveryEmailChecked: data.recoveryEmailChecked,
      recoveryPhoneChecked: data.recoveryPhoneChecked,
      backupCodesSaved: data.backupCodesSaved,
    },
    encryptedPayloadBase64,
    ivBase64,
    passwordChangedAt: data.passwordChangedAt,
    createdAt: existingItem?.createdAt ?? now,
    updatedAt: now,
    id: existingItem?.id,
  };

  const itemId = await saveVaultItem(data.vaultId, metadata);

  const decryptedItem: DecryptedVaultItem = {
    ...metadata,
    id: itemId,
    vaultId: data.vaultId,
    secrets,
    riskStatus: "secure",
  };

  const nextItems = existingItem
    ? allItems.map((i) => (i.id === itemId ? decryptedItem : i))
    : [...allItems, decryptedItem];

  const reuseGroups = detectReuseGroups(nextItems);
  decryptedItem.riskStatus = computeRiskStatus(decryptedItem, reuseGroups);

  return decryptedItem;
}
