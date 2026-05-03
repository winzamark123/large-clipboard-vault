import { Cache, Clipboard } from "@raycast/api";
import { evictOldEntries, hashText, saveClip } from "./lib/capture";
import { RAYCAST_HISTORY_CHAR_CAP } from "./lib/db";

const LAST_HASH_CACHE_KEY = "watcher-last-sha256";
const cache = new Cache();

export default async function Command() {
  const text = await Clipboard.readText();
  if (!text || text.length <= RAYCAST_HISTORY_CHAR_CAP) return;

  const sha256 = hashText({ text });
  // disk-backed sentinel skips the entire DB roundtrip when the clipboard is unchanged across watcher ticks
  if (cache.get(LAST_HASH_CACHE_KEY) === sha256) return;

  const { saved } = await saveClip({ text, sha256 });
  cache.set(LAST_HASH_CACHE_KEY, sha256);
  if (saved) await evictOldEntries();
}
