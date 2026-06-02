import type { ItemCategory, Importance, OwnerLabel } from "@/types";

export interface ImportedCredential {
  title: string;
  url: string;
  username: string;
  password: string;
  notes: string;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function guessCategory(url: string, title: string): ItemCategory {
  const t = `${url} ${title}`.toLowerCase();
  if (/github|gitlab|vercel|firebase|aws|developer/.test(t)) return "developer";
  if (/bank|paypal|stripe|finance/.test(t)) return "bank";
  if (/gmail|mail|outlook/.test(t)) return "email";
  if (/facebook|instagram|twitter|linkedin|social/.test(t)) return "social";
  if (/amazon|shop|store/.test(t)) return "shopping";
  return "login";
}

export function parsePasswordCsv(text: string): ImportedCredential[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows: ImportedCredential[] = [];

  const col = (names: string[]) =>
    names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;

  const nameIdx = col(["name", "title"]);
  const urlIdx = col(["url", "website", "origin"]);
  const userIdx = col(["username", "login", "email"]);
  const passIdx = col(["password", "pass"]);
  const noteIdx = col(["note", "notes"]);

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const url = urlIdx >= 0 ? fields[urlIdx]?.trim() ?? "" : "";
    const password = passIdx >= 0 ? fields[passIdx] ?? "" : "";
    if (!password && !url) continue;

    rows.push({
      title: nameIdx >= 0 ? fields[nameIdx]?.trim() || url || "Imported login" : url || "Imported login",
      url,
      username: userIdx >= 0 ? fields[userIdx]?.trim() ?? "" : "",
      password,
      notes: noteIdx >= 0 ? fields[noteIdx]?.trim() ?? "" : "",
    });
  }

  return rows;
}

export function importedToFormDefaults(
  row: ImportedCredential,
  vaultId: string
): {
  title: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  category: ItemCategory;
  vaultId: string;
  ownerLabel: OwnerLabel;
  importance: Importance;
} {
  return {
    title: row.title,
    url: row.url,
    username: row.username,
    password: row.password,
    notes: row.notes,
    category: guessCategory(row.url, row.title),
    vaultId,
    ownerLabel: "Family",
    importance: "medium",
  };
}
