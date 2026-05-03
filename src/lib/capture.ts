import { executeSQL } from "@raycast/utils";
import { createHash } from "crypto";
import { dbPath, ensureSchema, PREVIEW_CHAR_LIMIT, sqlText } from "./db";
import { getMaxEntries } from "./preferences";

type SaveResult = { saved: boolean; charCount: number; sha256: string };

export async function saveClip({ text }: { text: string }): Promise<SaveResult> {
  await ensureSchema();
  const sha256 = createHash("sha256").update(text).digest("hex");
  const charCount = text.length;
  const preview = text.slice(0, PREVIEW_CHAR_LIMIT);
  const createdAt = Date.now();

  // dedupe via UNIQUE(sha256) — DB drops duplicates atomically, no read-modify-write race
  const before = await countClips();
  await executeSQL(
    dbPath,
    `INSERT OR IGNORE INTO clips (sha256, content, char_count, preview, created_at)
     VALUES (${sqlText(sha256)}, ${sqlText(text)}, ${charCount}, ${sqlText(preview)}, ${createdAt})`,
  );
  const after = await countClips();
  return { saved: after > before, charCount, sha256 };
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

async function countClips() {
  const rows = await executeSQL<{ n: number }>(dbPath, `SELECT COUNT(*) AS n FROM clips`);
  return rows[0]?.n ?? 0;
}
