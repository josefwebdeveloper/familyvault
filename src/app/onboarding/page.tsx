"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useVaultStore } from "@/stores/vault-store";
import { setupVaultEncryption } from "@/lib/vault/service";
import { createUserProfile, createDefaultVaults } from "@/lib/firebase/firestore";
import { assessPasswordStrength } from "@/lib/crypto";
import { masterPasswordSchema } from "@/lib/validation/schemas";
import { DEFAULT_VAULTS } from "@/types";

const STEPS = ["Welcome", "Master Password", "Create Vaults", "Done"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { setUnlocked, setUserProfile, setVaults } = useVaultStore();
  const router = useRouter();

  const strength = password ? assessPasswordStrength(password) : null;

  const handleCreateVault = async () => {
    if (!user) return;

    const result = masterPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { crypto, vaultKey } = await setupVaultEncryption(password);

      await createUserProfile(user.uid, {
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        photoURL: user.photoURL ?? "",
        crypto,
      });

      const vaults = await createDefaultVaults(user.uid, user.email ?? "");

      setUserProfile({
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        photoURL: user.photoURL ?? "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        crypto,
        settings: { autoLockMinutes: 5, language: "en", theme: "system" },
      });
      setVaults(vaults);
      setUnlocked(vaultKey);
      setStep(3);
    } catch {
      setError("Failed to create vault. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-3xl">🔒</span>
          <h1 className="text-2xl font-bold text-slate-100 mt-2">Set Up FamilyVault</h1>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                i <= step ? "bg-emerald-500 w-12" : "bg-slate-700 w-8"
              }`}
            />
          ))}
        </div>

        <div className="card">
          {step === 0 && (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-slate-100">Welcome to FamilyVault</h2>
              <p className="text-slate-400">
                You will create a private vault. Your secrets are encrypted on your device
                before they are saved to the cloud.
              </p>
              <ul className="text-left text-sm text-slate-400 space-y-2 bg-slate-900/50 rounded-lg p-4">
                <li>✓ Passwords, notes, and recovery codes stay encrypted</li>
                <li>✓ Only you can decrypt with your master password</li>
                <li>✓ Guided password detox to stop reusing passwords</li>
              </ul>
              <button onClick={() => setStep(1)} className="btn-primary w-full">
                Continue
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-100">Create Master Vault Password</h2>
              <p className="text-sm text-slate-400">
                This password unlocks your vault. It is never sent to our servers.
              </p>

              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 text-sm text-amber-200">
                ⚠️ We cannot recover this password. If you forget it, your encrypted data
                cannot be decrypted.
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Master Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  autoComplete="new-password"
                  minLength={12}
                />
                {strength && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Strength</span>
                      <span className="capitalize">{strength.label}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  autoComplete="new-password"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary flex-1">Back</button>
                <button
                  onClick={() => {
                    const result = masterPasswordSchema.safeParse({ password, confirmPassword });
                    if (!result.success) {
                      setError(result.error.issues[0]?.message ?? "Invalid");
                      return;
                    }
                    setError("");
                    setStep(2);
                  }}
                  className="btn-primary flex-1"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-100">Your Vaults</h2>
              <p className="text-sm text-slate-400">
                We will create these default vaults for you:
              </p>
              <ul className="space-y-2">
                {DEFAULT_VAULTS.map((v) => (
                  <li key={v.type} className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-3">
                    <span className="text-xl">
                      {v.type === "personal" ? "👤" : v.type === "family" ? "👨‍👩‍👧‍👦" : v.type === "developer" ? "💻" : "🚨"}
                    </span>
                    <div>
                      <p className="font-medium text-slate-200">{v.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{v.type}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button
                  onClick={handleCreateVault}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? "Creating..." : "Create Vault"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <span className="text-5xl">🎉</span>
              <h2 className="text-xl font-semibold text-slate-100">Vault Created!</h2>
              <p className="text-slate-400">
                Your encrypted vault is ready. Start adding accounts or begin the Password Detox wizard.
              </p>
              <button onClick={() => router.push("/dashboard")} className="btn-primary w-full">
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
