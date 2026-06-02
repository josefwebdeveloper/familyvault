"use client";

import { useEffect } from "react";
import { useToastStore } from "@/stores/vault-store";
import { cn } from "@/lib/utils";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => removeToast(toast.id), 4000);
      return () => clearTimeout(timer);
    });
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-lg px-4 py-3 text-sm shadow-lg backdrop-blur-sm border animate-in slide-in-from-right",
            toast.type === "success" && "bg-emerald-900/90 border-emerald-700 text-emerald-100",
            toast.type === "error" && "bg-red-900/90 border-red-700 text-red-100",
            toast.type === "info" && "bg-slate-800/90 border-slate-600 text-slate-100"
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function toast(message: string, type: "success" | "error" | "info" = "info") {
  useToastStore.getState().addToast(message, type);
}
