"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, useVaultStore } from "@/stores/vault-store";
import { getUserProfile } from "@/lib/firebase/firestore";
import { LoadingState } from "@/components/ui/States";

const PUBLIC_PATHS = ["/"];
const AUTH_PATHS = ["/onboarding", "/unlock"];

export function VaultGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoading } = useAuthStore();
  const { isUnlocked } = useVaultStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user && !PUBLIC_PATHS.includes(pathname)) {
      router.replace("/");
      return;
    }

    if (user && pathname === "/") {
      checkAndRedirect(user.uid);
    }

    if (user && !isUnlocked && !PUBLIC_PATHS.includes(pathname) && !AUTH_PATHS.includes(pathname)) {
      router.replace("/unlock");
    }
  }, [user, isAuthLoading, isUnlocked, pathname, router]);

  async function checkAndRedirect(uid: string) {
    try {
      const profile = await getUserProfile(uid);
      if (!profile?.crypto) {
        router.replace("/onboarding");
      } else {
        router.replace("/unlock");
      }
    } catch {
      router.replace("/onboarding");
    }
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState message="Checking authentication..." />
      </div>
    );
  }

  return <>{children}</>;
}

export function UnlockedGuard({ children }: { children: React.ReactNode }) {
  const { isUnlocked } = useVaultStore();
  const { isAuthLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !isUnlocked) {
      router.replace("/unlock");
    }
  }, [isUnlocked, isAuthLoading, router]);

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState message="Vault is locked..." />
      </div>
    );
  }

  return <>{children}</>;
}
