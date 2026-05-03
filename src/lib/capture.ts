import { executeSQL } from "@raycast/utils";
import { createHash } from "crypto";
import { clipExists, dbPath, ensureSchema, PREVIEW_CHAR_LIMIT, sqlText } from "./db";
import { getMaxEntries } from "./preferences";

type SaveResult = { saved: boolean; charCount: number; sha256: string };

export function hashText({ text }: { text: string }) {
  return createHash("sha256").update(text).digest("hex");
}

export async function saveClip({ text, sha256: precomputed }: { text: string; sha256?: string }): Promise<SaveResult> {
  await ensureSchema();
  const sha256 = precomputed ?? hashText({ text });
  const charCount = text.length;

  // cheap UNIQUE-index point lookup avoids serializing the full clip into a SQL string when it already exists
  if (await clipExists({ sha256 })) {
    return { saved: false, charCount, sha256 };
  }

  const preview = text.slice(0, PREVIEW_CHAR_LIMIT);
  const createdAt = Date.now();
  await executeSQL(
    dbPath,
    `INSERT OR IGNORE INTO clips (sha256, content, char_count, preview, created_at)
     VALUES (${sqlText({ value: sha256 })}, ${sqlText({ value: text })}, ${charCount}, ${sqlText({ value: preview })}, ${createdAt})`,
  );
  return { saved: true, charCount, sha256 };
}

export async function evictOldEntries() {
  const max = getMaxEntries();
  await executeSQL(
    dbPath,
    `DELETE FROM clips
     WHERE id NOT IN (
       SELECT id FROM clips ORDER BY created_at DESC LIMIT ${max}
     )`,
  );
}
