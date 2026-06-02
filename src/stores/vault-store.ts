"use client";

import { create } from "zustand";
import type {
  UserProfile,
  Vault,
  DecryptedVaultItem,
  UserSettings,
} from "@/types";

interface VaultState {
  isUnlocked: boolean;
  vaultKey: CryptoKey | null;
  userProfile: UserProfile | null;
  vaults: Vault[];
  items: DecryptedVaultItem[];
  lastActivity: number;
  isLoading: boolean;

  setUnlocked: (key: CryptoKey) => void;
  lock: () => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setVaults: (vaults: Vault[]) => void;
  setItems: (items: DecryptedVaultItem[]) => void;
  addItem: (item: DecryptedVaultItem) => void;
  updateItem: (item: DecryptedVaultItem) => void;
  removeItem: (itemId: string) => void;
  touchActivity: () => void;
  setLoading: (loading: boolean) => void;
  getSettings: () => UserSettings;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  isUnlocked: false,
  vaultKey: null,
  userProfile: null,
  vaults: [],
  items: [],
  lastActivity: Date.now(),
  isLoading: false,

  setUnlocked: (key) =>
    set({ isUnlocked: true, vaultKey: key, lastActivity: Date.now() }),

  lock: () =>
    set({
      isUnlocked: false,
      vaultKey: null,
      items: [],
      lastActivity: 0,
    }),

  setUserProfile: (profile) => set({ userProfile: profile }),
  setVaults: (vaults) => set({ vaults }),
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  updateItem: (item) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === item.id ? item : i)),
    })),
  removeItem: (itemId) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== itemId) })),

  touchActivity: () => set({ lastActivity: Date.now() }),
  setLoading: (loading) => set({ isLoading: loading }),

  getSettings: () =>
    get().userProfile?.settings ?? {
      autoLockMinutes: 5,
      language: "en",
      theme: "system",
    },
}));

interface AuthState {
  user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  isAuthLoading: boolean;
  setUser: (user: AuthState["user"]) => void;
  setAuthLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthLoading: true,
  setUser: (user) => set({ user }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
}));

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = "info") =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id: crypto.randomUUID(), message, type },
      ],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
