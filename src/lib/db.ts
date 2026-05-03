import { Cache, environment } from "@raycast/api";
import { executeSQL } from "@raycast/utils";
import { mkdir } from "fs/promises";
import path from "path";

export const RAYCAST_HISTORY_CHAR_CAP = 32_768;

export const PREVIEW_CHAR_LIMIT = 200;

export const dbPath = path.join(environment.supportPath, "vault.db");

const SCHEMA_VERSION = "1";
const SCHEMA_CACHE_KEY = "schema-version";

const cache = new Cache();

export type ClipRow = {
  id: number;
  preview: string;
  char_count: number;
  created_at: number;
};

let schemaReadyInProcess = false;

export async function ensureSchema() {
  if (schemaReadyInProcess) return;
  // disk-backed sentinel survives across the watcher's per-tick fresh processes
  if (cache.get(SCHEMA_CACHE_KEY) === SCHEMA_VERSION) {
    schemaReadyInProcess = true;
    return;
  }
  await mkdir(environment.supportPath, { recursive: true });
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
  cache.set(SCHEMA_CACHE_KEY, SCHEMA_VERSION);
  schemaReadyInProcess = true;
}

// no parameter binding in executeSQL — manual escape is the only safe path for user-controlled strings
export function sqlText({ value }: { value: string }) {
  if (!value.includes("'")) return `'${value}'`;
  return `'${value.replace(/'/g, "''")}'`;
}

export async function clipExists({ sha256 }: { sha256: string }) {
  await ensureSchema();
  const rows = await executeSQL<{ n: number }>(
    dbPath,
    `SELECT COUNT(*) AS n FROM clips WHERE sha256 = ${sqlText({ value: sha256 })}`,
  );
  return (rows[0]?.n ?? 0) > 0;
}

export async function listClips({ search, limit }: { search: string; limit: number }) {
  await ensureSchema();
  const where = search.trim().length > 0 ? `WHERE content LIKE ${sqlText({ value: "%" + search + "%" })}` : "";
  return executeSQL<ClipRow>(
    dbPath,
    `SELECT id, preview, char_count, created_at FROM clips
     ${where}
     ORDER BY created_at DESC
     LIMIT ${limit}`,
  );
}

export async function getClipContent({ id }: { id: number }) {
  await ensureSchema();
  const rows = await executeSQL<{ content: string }>(dbPath, `SELECT content FROM clips WHERE id = ${id}`);
  return rows[0]?.content;
}

export async function deleteClipById({ id }: { id: number }) {
  await executeSQL(dbPath, `DELETE FROM clips WHERE id = ${id}`);
}
