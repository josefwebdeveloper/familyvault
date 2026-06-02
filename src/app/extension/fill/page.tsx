"use client";

import { useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useVaultStore } from "@/stores/vault-store";
import { itemsMatchingUrl, fullUrl } from "@/lib/vault/url-match";
import Link from "next/link";

function FillContent() {
  const params = useSearchParams();
  const targetUrl = params.get("url") ?? "";
  const { items, isUnlocked } = useVaultStore();

  const matches = useMemo(
    () => itemsMatchingUrl(items, targetUrl),
    [items, targetUrl]
  );

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "FAMILYVAULT_REQUEST_FILL") {
        // popup ready signal from opener
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const autofill = (username: string, password: string) => {
    if (window.opener) {
      window.opener.postMessage(
        { type: "FAMILYVAULT_FILL", username, password },
        "*"
      );
      window.close();
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-center">
        <p className="text-slate-300 mb-4">Unlock your vault first</p>
        <Link href={`/unlock?redirect=/extension/fill?url=${encodeURIComponent(targetUrl)}`} className="btn-primary">
          Unlock vault
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-200">
      <h1 className="text-lg font-bold mb-1">FamilyVault Fill</h1>
      {targetUrl && (
        <p className="text-xs text-slate-500 mb-4 truncate">{targetUrl}</p>
      )}

      {matches.length === 0 ? (
        <div className="text-sm text-slate-400 space-y-3">
          <p>No saved login for this site.</p>
          <Link
            href="/dashboard"
            className="text-emerald-400 underline"
          >
            Add account in FamilyVault
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {matches.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-700 bg-slate-800/50 p-3"
            >
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-slate-500 mb-2">{item.username || "—"}</p>
              <button
                type="button"
                onClick={() =>
                  autofill(item.username, item.secrets.password)
                }
                className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500"
              >
                Autofill this tab
              </button>
              {item.url && (
                <a
                  href={fullUrl(item.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-xs text-slate-400 mt-2"
                >
                  Open site
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-600 mt-6">
        Install the FamilyVault browser extension for a fill button on login pages.
      </p>
    </div>
  );
}

export default function ExtensionFillPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <FillContent />
    </Suspense>
  );
}
