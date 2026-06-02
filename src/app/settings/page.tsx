"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { UnlockedGuard } from "@/components/providers/VaultGuard";
import { ConfirmDialog } from "@/components/ui/States";
import { useVaultStore, useAuthStore } from "@/stores/vault-store";
import { updateUserSettings, updateUserCrypto, deleteUserAccount } from "@/lib/firebase/firestore";
import { setupVaultEncryption } from "@/lib/vault/service";
import { signOut } from "@/lib/firebase/auth";
import { toast } from "@/components/ui/Toast";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <UnlockedGuard>
      <AppShell>
        <SettingsContent />
      </AppShell>
    </UnlockedGuard>
  );
}

function SettingsContent() {
  const { userProfile, getSettings, setUserProfile, lock } = useVaultStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const settings = getSettings();

  const [autoLock, setAutoLock] = useState(settings.autoLockMinutes);
  const [theme, setTheme] = useState(settings.theme);
  const [showDelete, setShowDelete] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleAutoLockChange = async (minutes: number) => {
    setAutoLock(minutes);
    if (!user) return;
    await updateUserSettings(user.uid, { autoLockMinutes: minutes });
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        settings: { ...userProfile.settings, autoLockMinutes: minutes },
      });
    }
    toast("Auto-lock updated", "success");
  };

  const handleThemeChange = async (newTheme: "system" | "light" | "dark") => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme === "system" ? "" : newTheme);
    if (!user) return;
    await updateUserSettings(user.uid, { theme: newTheme });
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        settings: { ...userProfile.settings, theme: newTheme },
      });
    }
  };

  const handleChangePassword = async () => {
    if (!user || newPassword !== confirmPassword || newPassword.length < 12) {
      toast("Passwords must match and be at least 12 characters", "error");
      return;
    }

    try {
      const { crypto, vaultKey } = await setupVaultEncryption(newPassword);
      await updateUserCrypto(user.uid, crypto);
      useVaultStore.getState().setUnlocked(vaultKey);
      setShowChangePassword(false);
      setNewPassword("");
      setConfirmPassword("");
      toast("Master password changed. Re-encrypt with new key on next save.", "success");
    } catch {
      toast("Failed to change password", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await deleteUserAccount(user.uid);
      lock();
      await signOut();
      router.push("/");
      toast("Account deleted", "info");
    } catch {
      toast("Failed to delete account", "error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-400">Manage your vault preferences</p>
      </div>

      <section className="card space-y-3">
        <h2 className="font-medium text-slate-200">Account</h2>
        <div className="text-sm text-slate-400">
          <p>{userProfile?.displayName}</p>
          <p>{userProfile?.email}</p>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium text-slate-200">Vault Security</h2>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Auto-lock after inactivity</label>
          <select
            value={autoLock}
            onChange={(e) => handleAutoLockChange(parseInt(e.target.value))}
            className="input"
          >
            <option value={1}>1 minute</option>
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
        </div>
        <button
          onClick={() => setShowChangePassword(true)}
          className="btn-secondary w-full"
        >
          Change Master Password
        </button>
        <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-500">
          Passkey / WebAuthn setup — coming in Phase 2
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium text-slate-200">Appearance</h2>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Theme</label>
          <select
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value as "system" | "light" | "dark")}
            className="input"
          >
            <option value="system">System</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Language</label>
          <select className="input" disabled value="en">
            <option value="en">English</option>
            <option value="ru">Russian (coming soon)</option>
            <option value="he">Hebrew (coming soon)</option>
          </select>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium text-slate-200">Data</h2>
        <Link href="/backup" className="btn-secondary w-full inline-block text-center">
          Export Encrypted Backup
        </Link>
        <button
          onClick={() => setShowDelete(true)}
          className="w-full py-2.5 rounded-lg bg-red-900/50 text-red-400 hover:bg-red-900 transition text-sm"
        >
          Delete Account
        </button>
      </section>

      <section className="card border-amber-700/30 bg-amber-900/10 text-sm text-slate-400 space-y-2">
        <h2 className="font-medium text-amber-200">Limitations</h2>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>If you forget your master password, encrypted data cannot be recovered.</li>
          <li>Metadata (titles, categories) may be visible to Firebase.</li>
          <li>Browser security matters — XSS attacks can be dangerous.</li>
          <li>This is a private/family MVP, not audited enterprise software.</li>
        </ul>
      </section>

      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Change Master Password</h3>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="New master password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowChangePassword(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleChangePassword} className="btn-primary flex-1">Change</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDelete}
        title="Delete Account"
        message="This will permanently delete your account and all vault data. This cannot be undone."
        confirmLabel="Delete Everything"
        danger
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
