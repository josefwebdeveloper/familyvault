"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useVaultStore } from "@/stores/vault-store";
import { getUserProfile, getUserVaults, getAllUserItems } from "@/lib/firebase/firestore";
import { unlockVaultWithPassword, decryptAllItems } from "@/lib/vault/service";

export default function UnlockPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { user } = useAuthStore();
  const { setUnlocked, setUserProfile, setVaults, setItems } = useVaultStore();
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      if (!user) return;
      try {
        const profile = await getUserProfile(user.uid);
        if (!profile?.crypto) {
          router.replace("/onboarding");
          return;
        }
        setUserProfile(profile);
      } catch {
        router.replace("/onboarding");
      } finally {
        setChecking(false);
      }
    }
    checkProfile();
  }, [user, router, setUserProfile]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const profile = await getUserProfile(user.uid);
      if (!profile?.crypto) {
        router.replace("/onboarding");
        return;
      }

      const vaultKey = await unlockVaultWithPassword(password, profile.crypto);
      const vaults = await getUserVaults(user.uid);
      const rawItems = await getAllUserItems(user.uid);
      const items = await decryptAllItems(rawItems, vaultKey);

      setUserProfile(profile);
      setVaults(vaults);
      setItems(items);
      setUnlocked(vaultKey);
      setPassword("");
      router.push("/dashboard");
    } catch {
      setError("Incorrect master password. Please try again.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🔒</span>
          <h1 className="text-2xl font-bold text-slate-100 mt-3">Unlock Vault</h1>
          <p className="text-sm text-slate-400 mt-2">
            Enter your master vault password to access your secrets.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="card space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Master Vault Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn-primary w-full"
          >
            {loading ? "Unlocking..." : "Unlock Vault"}
          </button>

          <p className="text-xs text-slate-500 text-center">
            Your password is processed locally and never sent to the server.
          </p>
        </form>

        <p className="text-xs text-slate-600 text-center mt-6">
          Passkey unlock coming soon.
        </p>
      </div>
    </div>
  );
}
