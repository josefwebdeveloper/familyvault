import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "./config";
import type {
  UserProfile,
  Vault,
  VaultItemMetadata,
  CryptoSettings,
  UserSettings,
  VaultType,
} from "@/types";
import { DEFAULT_VAULTS } from "@/types";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function createUserProfile(
  userId: string,
  data: {
    email: string;
    displayName: string;
    photoURL: string;
    crypto: CryptoSettings;
  }
): Promise<void> {
  const db = getFirebaseDb();
  const now = new Date().toISOString();
  const profile: UserProfile = {
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    createdAt: now,
    updatedAt: now,
    crypto: data.crypto,
    settings: {
      autoLockMinutes: 5,
      language: "en",
      theme: "system",
    },
  };
  await setDoc(doc(db, "users", userId), profile);
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  const db = getFirebaseDb();
  const profile = await getUserProfile(userId);
  if (!profile) throw new Error("User profile not found");
  await updateDoc(doc(db, "users", userId), {
    settings: { ...profile.settings, ...settings },
    updatedAt: new Date().toISOString(),
  });
}

export async function updateUserCrypto(
  userId: string,
  crypto: CryptoSettings
): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "users", userId), {
    crypto,
    updatedAt: new Date().toISOString(),
  });
}

export async function createDefaultVaults(userId: string, email: string): Promise<Vault[]> {
  const db = getFirebaseDb();
  const vaults: Vault[] = [];
  const now = new Date().toISOString();

  for (const template of DEFAULT_VAULTS) {
    const vaultData: Omit<Vault, "id"> = {
      name: template.name,
      type: template.type,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
      memberIds: [userId],
      simpleSharingMode: template.type === "family",
    };

    const ref = await addDoc(collection(db, "vaults"), vaultData);
    const vault: Vault = { id: ref.id, ...vaultData };
    vaults.push(vault);

    await setDoc(doc(db, "vaults", ref.id, "members", userId), {
      role: "owner",
      email,
      joinedAt: now,
      status: "active",
    });
  }

  return vaults;
}

export async function getUserVaults(userId: string): Promise<Vault[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "vaults"),
    where("memberIds", "array-contains", userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vault));
}

export async function getVault(vaultId: string): Promise<Vault | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "vaults", vaultId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Vault;
}

export async function getVaultItems(vaultId: string): Promise<VaultItemMetadata[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, "vaults", vaultId, "items"));
  return snap.docs
    .map((d) => ({ id: d.id, vaultId, ...d.data() } as VaultItemMetadata))
    .filter((item) => !item.deletedAt);
}

export async function getAllUserItems(userId: string): Promise<VaultItemMetadata[]> {
  const vaults = await getUserVaults(userId);
  const allItems: VaultItemMetadata[] = [];
  for (const vault of vaults) {
    const items = await getVaultItems(vault.id);
    allItems.push(...items);
  }
  return allItems;
}

export async function saveVaultItem(
  vaultId: string,
  item: Omit<VaultItemMetadata, "id" | "vaultId"> & { id?: string }
): Promise<string> {
  const db = getFirebaseDb();
  const now = new Date().toISOString();
  const data = { ...item, updatedAt: now };

  if (item.id) {
    await setDoc(doc(db, "vaults", vaultId, "items", item.id), data);
    return item.id;
  }

  const ref = await addDoc(collection(db, "vaults", vaultId, "items"), {
    ...data,
    createdAt: now,
  });
  return ref.id;
}

export async function deleteVaultItem(vaultId: string, itemId: string): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "vaults", vaultId, "items", itemId), {
    deletedAt: new Date().toISOString(),
  });
}

export async function inviteFamilyMember(
  vaultId: string,
  email: string,
  invitedBy: string
): Promise<void> {
  const db = getFirebaseDb();
  const memberId = email.replace(/[^a-zA-Z0-9]/g, "_");
  await setDoc(doc(db, "vaults", vaultId, "members", memberId), {
    role: "member",
    email,
    joinedAt: new Date().toISOString(),
    status: "pending",
    invitedBy,
  });
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const db = getFirebaseDb();
  const vaults = await getUserVaults(userId);
  for (const vault of vaults) {
    if (vault.ownerId === userId) {
      const items = await getVaultItems(vault.id);
      for (const item of items) {
        await deleteDoc(doc(db, "vaults", vault.id, "items", item.id));
      }
      await deleteDoc(doc(db, "vaults", vault.id));
    }
  }
  await deleteDoc(doc(db, "users", userId));
}
