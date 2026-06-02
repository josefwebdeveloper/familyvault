"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface CopyButtonProps {
  value: string;
  label?: string;
  clearAfterMs?: number;
  className?: string;
}

export function CopyButton({
  value,
  label = "Copy",
  clearAfterMs = 30000,
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(value, clearAfterMs);
      setCopied(true);
      toast(`${label} copied`, "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Failed to copy", "error");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition ${className}`}
      type="button"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

interface RevealSecretButtonProps {
  value: string;
  className?: string;
}

export function RevealSecretButton({ value, className = "" }: RevealSecretButtonProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono text-sm text-slate-300">
        {revealed ? value : "••••••••••••"}
      </span>
      <button
        onClick={() => setRevealed(!revealed)}
        className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
        type="button"
      >
        {revealed ? "Hide" : "Reveal"}
      </button>
      {revealed && <CopyButton value={value} label="Password" />}
    </div>
  );
}
