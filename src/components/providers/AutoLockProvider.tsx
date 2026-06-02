"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useVaultStore } from "@/stores/vault-store";

const PUBLIC_PATHS = ["/", "/onboarding", "/unlock"];

export function AutoLockProvider({ children }: { children: React.ReactNode }) {
  const { isUnlocked, lastActivity, lock, getSettings } = useVaultStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLock = useCallback(() => {
    lock();
    if (!PUBLIC_PATHS.includes(pathname)) {
      router.push("/unlock");
    }
  }, [lock, router, pathname]);

  useEffect(() => {
    if (!isUnlocked) return;

    const settings = getSettings();
    const lockMs = settings.autoLockMinutes * 60 * 1000;

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > lockMs) {
        handleLock();
      }
    }, 10000);

    const onActivity = () => useVaultStore.getState().touchActivity();
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("click", onActivity);
    window.addEventListener("scroll", onActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
      window.removeEventListener("scroll", onActivity);
    };
  }, [isUnlocked, lastActivity, getSettings, handleLock]);

  return <>{children}</>;
}
