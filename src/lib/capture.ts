import { createHash } from "crypto";
import { PREVIEW_CHAR_LIMIT, withVault } from "./db";
import { getMaxEntries } from "./preferences";

type SaveResult = { saved: boolean; charCount: number; sha256: string };

export function hashText({ text }: { text: string }) {
  return createHash("sha256").update(text).digest("hex");
}

export async function saveClip({ text, sha256: precomputed }: { text: string; sha256?: string }): Promise<SaveResult> {
  const sha256 = precomputed ?? hashText({ text });
  const charCount = text.length;
  const preview = text.slice(0, PREVIEW_CHAR_LIMIT);
  const createdAt = Date.now();

  return withVault({
    run: (db) => {
      // INSERT OR IGNORE + UNIQUE(sha256) gives atomic dedupe; .changes tells us if the row was new
      const info = db
        .prepare(
          `INSERT OR IGNORE INTO clips (sha256, content, char_count, preview, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(sha256, text, charCount, preview, createdAt);
      return { saved: Number(info.changes) > 0, charCount, sha256 };
    },
  });
}

export async function evictOldEntries() {
  const max = getMaxEntries();
  return withVault({
    run: (db) => {
      db.prepare(
        `DELETE FROM clips
         WHERE id NOT IN (
           SELECT id FROM clips ORDER BY created_at DESC LIMIT ?
         )`,
      ).run(max);
    },
  });
}
