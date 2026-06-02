"use client";

import { useState, useCallback } from "react";
import { generatePassword, assessPasswordStrength } from "@/lib/crypto";
import type { PasswordGeneratorOptions } from "@/types";
import { CopyButton } from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils";

const DEFAULT_OPTIONS: PasswordGeneratorOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  avoidConfusing: true,
  memorable: false,
};

interface PasswordGeneratorProps {
  onUse?: (password: string) => void;
  compact?: boolean;
}

export function PasswordGenerator({ onUse, compact = false }: PasswordGeneratorProps) {
  const [options, setOptions] = useState<PasswordGeneratorOptions>(DEFAULT_OPTIONS);
  const [password, setPassword] = useState(() => generatePassword(DEFAULT_OPTIONS));

  const regenerate = useCallback(() => {
    setPassword(generatePassword(options));
  }, [options]);

  const updateOption = <K extends keyof PasswordGeneratorOptions>(
    key: K,
    value: PasswordGeneratorOptions[K]
  ) => {
    const next = { ...options, [key]: value };
    setOptions(next);
    setPassword(generatePassword(next));
  };

  const strength = assessPasswordStrength(password);

  const strengthColors = {
    weak: "bg-red-500",
    fair: "bg-orange-500",
    good: "bg-yellow-500",
    strong: "bg-emerald-500",
  };

  return (
    <div className={cn("rounded-xl border border-slate-700 bg-slate-800/50 p-4", compact && "p-3")}>
      <div className="flex items-center gap-2 mb-3">
        <input
          readOnly
          value={password}
          className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 font-mono text-sm text-emerald-300"
        />
        <CopyButton value={password} label="Password" />
        <button
          onClick={regenerate}
          className="px-3 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
          type="button"
        >
          ↻
        </button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Strength</span>
          <span className="capitalize">{strength.label}</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all", strengthColors[strength.label])}
            style={{ width: `${strength.score}%` }}
          />
        </div>
      </div>

      {!compact && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Length: {options.length}</label>
            <div className="flex gap-2 flex-wrap">
              {[12, 16, 20, 24].map((len) => (
                <button
                  key={len}
                  onClick={() => updateOption("length", len)}
                  className={cn(
                    "px-2 py-1 text-xs rounded",
                    options.length === len
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-700 text-slate-300"
                  )}
                  type="button"
                >
                  {len}
                </button>
              ))}
              <input
                type="number"
                min={8}
                max={128}
                value={options.length}
                onChange={(e) => updateOption("length", parseInt(e.target.value) || 20)}
                className="w-16 px-2 py-1 text-xs rounded bg-slate-700 text-slate-300 border border-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["uppercase", "Uppercase"],
                ["lowercase", "Lowercase"],
                ["numbers", "Numbers"],
                ["symbols", "Symbols"],
                ["avoidConfusing", "Avoid confusing"],
                ["memorable", "Memorable mode"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={(e) => updateOption(key, e.target.checked)}
                  className="rounded border-slate-600"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {onUse && (
        <button
          onClick={() => onUse(password)}
          className="mt-3 w-full py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
          type="button"
        >
          Use this password
        </button>
      )}
    </div>
  );
}
