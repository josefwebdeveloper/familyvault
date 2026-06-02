"use client";

import { useEffect } from "react";
import { subscribeToAuth } from "@/lib/firebase/auth";
import { useAuthStore } from "@/stores/vault-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, [setUser, setAuthLoading]);

  return <>{children}</>;
}
