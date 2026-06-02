"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DecryptedVaultItem, Vault, ItemCategory, OwnerLabel, Importance } from "@/types";
import { PasswordGenerator } from "@/components/PasswordGenerator";
import { assessPasswordStrength } from "@/lib/crypto";
import { CATEGORIES, OWNERS, IMPORTANCE_LEVELS } from "@/components/vault/ItemViews";
import { CATEGORY_LABELS } from "@/types";

interface ItemFormProps {
  vaults: Vault[];
  item?: DecryptedVaultItem;
  defaultVaultId?: string;
  onSave: (data: ItemFormData, options?: { isAutoSave?: boolean }) => Promise<void>;
  onCancel: () => void;
  autoSave?: boolean;
}

export interface ItemFormData {
  title: string;
  url: string;
  username: string;
  category: ItemCategory;
  vaultId: string;
  ownerLabel: OwnerLabel;
  importance: Importance;
  password: string;
  notes: string;
  backupCodes: string;
  twoFactorEnabled: "yes" | "no" | "unknown";
  passkeyEnabled: "yes" | "no" | "not_supported" | "unknown";
  recoveryEmailChecked: "yes" | "no" | "unknown";
  recoveryPhoneChecked: "yes" | "no" | "unknown";
  backupCodesSaved: "yes" | "no" | "unknown";
  passwordChangedAt: string;
  remindRotation: boolean;
}

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export function ItemForm({
  vaults,
  item,
  defaultVaultId,
  onSave,
  onCancel,
  autoSave = true,
}: ItemFormProps) {
  const [form, setForm] = useState<ItemFormData>({
    title: item?.title ?? "",
    url: item?.url ?? "",
    username: item?.username ?? "",
    category: item?.category ?? "login",
    vaultId: item?.vaultId ?? defaultVaultId ?? vaults[0]?.id ?? "",
    ownerLabel: item?.ownerLabel ?? "Family",
    importance: item?.importance ?? "medium",
    password: item?.secrets.password ?? "",
    notes: item?.secrets.notes ?? "",
    backupCodes: item?.secrets.backupCodes ?? "",
    twoFactorEnabled: item?.securityChecklist.twoFactorEnabled ?? "unknown",
    passkeyEnabled: item?.securityChecklist.passkeyEnabled ?? "unknown",
    recoveryEmailChecked: item?.securityChecklist.recoveryEmailChecked ?? "unknown",
    recoveryPhoneChecked: item?.securityChecklist.recoveryPhoneChecked ?? "unknown",
    backupCodesSaved: item?.securityChecklist.backupCodesSaved ?? "unknown",
    passwordChangedAt: item?.passwordChangedAt ?? new Date().toISOString().split("T")[0],
    remindRotation: false,
  });
  const [showGenerator, setShowGenerator] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState("");
  const skipNextAutoSave = useRef(true);
  const formRef = useRef(form);
  formRef.current = form;

  const strength = form.password ? assessPasswordStrength(form.password) : null;

  const update = <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (autoSave) setSaveStatus("pending");
  };

  const persist = useCallback(
    async (isAutoSave: boolean) => {
      const data = formRef.current;
      if (!data.title.trim()) return;

      setSaving(true);
      setSaveStatus("saving");
      setError("");
      try {
        await onSave(data, { isAutoSave });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
        if (!isAutoSave) setError("Failed to save item");
      } finally {
        setSaving(false);
      }
    },
    [onSave]
  );

  useEffect(() => {
    if (!autoSave) return;
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    if (!form.title.trim()) {
      setSaveStatus("idle");
      return;
    }

    const timer = setTimeout(() => {
      persist(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [form, autoSave, persist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    await persist(false);
  };

  const statusLabel = {
    idle: autoSave ? "Type to auto-save" : "",
    pending: "Will save…",
    saving: "Saving…",
    saved: "✓ Saved automatically",
    error: "Save failed — try again",
  }[saveStatus];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {autoSave && (
        <div
          className={`text-xs px-3 py-2 rounded-lg border ${
            saveStatus === "saved"
              ? "bg-emerald-900/20 border-emerald-700 text-emerald-300"
              : saveStatus === "error"
                ? "bg-red-900/20 border-red-800 text-red-300"
                : "bg-slate-900/50 border-slate-700 text-slate-400"
          }`}
        >
          {statusLabel}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3">
          {error}
        </div>
      )}

      <Section title="Basic Info">
        <Field label="Title *">
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="input"
            required
            placeholder="e.g. Bringoz Console"
          />
        </Field>
        <Field label="URL">
          <input
            value={form.url}
            onChange={(e) => update("url", e.target.value)}
            className="input"
            placeholder="https://"
          />
        </Field>
        <Field label="Username / Email">
          <input
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as ItemCategory)}
              className="input"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </Field>
          <Field label="Vault">
            <select
              value={form.vaultId}
              onChange={(e) => update("vaultId", e.target.value)}
              className="input"
            >
              {vaults.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner">
            <select
              value={form.ownerLabel}
              onChange={(e) => update("ownerLabel", e.target.value as OwnerLabel)}
              className="input"
            >
              {OWNERS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Importance">
            <select
              value={form.importance}
              onChange={(e) => update("importance", e.target.value as Importance)}
              className="input"
            >
              {IMPORTANCE_LEVELS.map((l) => (
                <option key={l} value={l} className="capitalize">{l}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Secrets">
        <Field label="Password">
          <div className="flex gap-2">
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="input flex-1"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowGenerator(!showGenerator)}
              className="px-3 py-2 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 whitespace-nowrap"
            >
              Generate
            </button>
          </div>
          {strength && (
            <p className="text-xs text-slate-400 mt-1 capitalize">
              Strength: {strength.label}
            </p>
          )}
        </Field>
        {showGenerator && (
          <PasswordGenerator
            onUse={(pw) => { update("password", pw); setShowGenerator(false); }}
            compact
          />
        )}
        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className="input min-h-[80px]"
            rows={3}
          />
        </Field>
        <Field label="Backup Codes">
          <textarea
            value={form.backupCodes}
            onChange={(e) => update("backupCodes", e.target.value)}
            className="input min-h-[60px] font-mono text-xs"
            rows={2}
            placeholder="One code per line"
          />
        </Field>
      </Section>

      <Section title="Security Checklist">
        <TriField label="2FA enabled" value={form.twoFactorEnabled} onChange={(v) => update("twoFactorEnabled", v)} />
        <TriField label="Passkey enabled" value={form.passkeyEnabled} onChange={(v) => update("passkeyEnabled", v)} passkey />
        <TriField label="Recovery email checked" value={form.recoveryEmailChecked} onChange={(v) => update("recoveryEmailChecked", v)} />
        <TriField label="Recovery phone checked" value={form.recoveryPhoneChecked} onChange={(v) => update("recoveryPhoneChecked", v)} />
        <TriField label="Backup codes saved" value={form.backupCodesSaved} onChange={(v) => update("backupCodesSaved", v)} />
        <Field label="Password changed date">
          <input
            type="date"
            value={form.passwordChangedAt}
            onChange={(e) => update("passwordChangedAt", e.target.value)}
            className="input"
          />
        </Field>
      </Section>

      <div className="flex gap-3 pt-2 sticky bottom-0 bg-slate-800 pb-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition text-sm"
        >
          {autoSave && saveStatus === "saved" ? "Done" : "Cancel"}
        </button>
        {!autoSave && (
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : item ? "Update Item" : "Save Item"}
          </button>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function TriField({
  label,
  value,
  onChange,
  passkey = false,
}: {
  label: string;
  value: string;
  onChange: (v: "yes" | "no" | "unknown") => void;
  passkey?: boolean;
}) {
  const options = passkey
    ? ["yes", "no", "not_supported", "unknown"]
    : ["yes", "no", "unknown"];

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as "yes" | "no" | "unknown")}
        className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-300"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
        ))}
      </select>
    </div>
  );
}
