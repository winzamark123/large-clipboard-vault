import { environment } from "@raycast/api";
import { executeSQL } from "@raycast/utils";
import { mkdir } from "fs/promises";
import path from "path";

export const RAYCAST_HISTORY_CHAR_CAP = 32_768;

export const PREVIEW_CHAR_LIMIT = 200;

export const dbPath = path.join(environment.supportPath, "vault.db");

export type ClipRow = {
  id: number;
  preview: string;
  char_count: number;
  created_at: number;
};

export type ClipContentRow = { content: string };

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
  await mkdir(environment.supportPath, { recursive: true });
  // single statement per call — executeSQL passes the string straight through
  await executeSQL(
    dbPath,
    `CREATE TABLE IF NOT EXISTS clips (
       id          INTEGER PRIMARY KEY AUTOINCREMENT,
       sha256      TEXT    NOT NULL UNIQUE,
       content     TEXT    NOT NULL,
       char_count  INTEGER NOT NULL,
       preview     TEXT    NOT NULL,
       created_at  INTEGER NOT NULL
     )`,
  );
  await executeSQL(dbPath, `CREATE INDEX IF NOT EXISTS idx_clips_created_at ON clips(created_at DESC)`);
  schemaReady = true;
}

// SQLite TEXT literal escape — double single-quotes. executeSQL has no parameter
// binding, so this is the safe path for user-controlled strings.
export function sqlText(s: string) {
  return "'" + s.replace(/'/g, "''") + "'";
}
