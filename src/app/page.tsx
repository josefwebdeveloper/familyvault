"use client";

import { signInWithGoogle } from "@/lib/firebase/auth";
import { useAuthStore } from "@/stores/vault-store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase/config";

const FEATURES = [
  { icon: "🔐", title: "Encrypted Vault", desc: "All secrets encrypted on your device before saving." },
  { icon: "🔄", title: "Password Detox Wizard", desc: "Step-by-step guide to replace reused passwords." },
  { icon: "👨‍👩‍👧‍👦", title: "Family Shared Vault", desc: "Share important accounts securely with family." },
  { icon: "✅", title: "2FA / Passkey Checklist", desc: "Track two-factor and passkey status per account." },
  { icon: "🔑", title: "Recovery Codes Storage", desc: "Safely store backup and recovery codes." },
  { icon: "🚨", title: "Emergency Notes", desc: "Insurance, medical info, and family instructions." },
];

export default function LandingPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!isFirebaseConfigured()) {
      setError("Firebase is not configured. Add your credentials to .env.local");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      router.push("/onboarding");
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingRedirect />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            <span className="font-bold text-xl text-slate-100">FamilyVault</span>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4 leading-tight">
            FamilyVault — your private family security vault
          </h1>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Stop using the same password everywhere. Move to unique strong passwords step by step.
          </p>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-slate-900 font-medium hover:bg-slate-100 transition disabled:opacity-50"
          >
            <GoogleIcon />
            {loading ? "Signing in..." : "Sign in with Google"}
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          <p className="mt-6 text-xs text-slate-500 max-w-md mx-auto">
            Your secrets are encrypted on your device before they are saved.
            We cannot recover your master password if you forget it.
          </p>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card">
                <span className="text-3xl mb-3 block">{f.icon}</span>
                <h3 className="font-semibold text-slate-100 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 py-16 text-center border-t border-slate-800">
          <h2 className="text-2xl font-bold text-slate-100 mb-4">How security works</h2>
          <p className="text-slate-400 mb-6">
            Your secrets are encrypted on your device before they are saved.
            The server only stores encrypted data — it never sees your passwords, notes, or recovery codes.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            <div className="card text-center">
              <span className="text-2xl">1️⃣</span>
              <p className="text-sm text-slate-300 mt-2">Create a master vault password on your device</p>
            </div>
            <div className="card text-center">
              <span className="text-2xl">2️⃣</span>
              <p className="text-sm text-slate-300 mt-2">Secrets encrypted locally with AES-GCM</p>
            </div>
            <div className="card text-center">
              <span className="text-2xl">3️⃣</span>
              <p className="text-sm text-slate-300 mt-2">Only encrypted blobs stored in Firebase</p>
            </div>
          </div>
          <p className="mt-8 text-xs text-slate-500">
            This is a private/family MVP, not audited enterprise security software.
            Metadata like titles and categories may be visible to Firebase.
          </p>
        </section>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LoadingRedirect() {
  return (
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-400">Redirecting...</p>
    </div>
  );
}
