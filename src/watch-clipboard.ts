import { Clipboard } from "@raycast/api";
import { saveClip, evictOldEntries } from "./lib/capture";
import { RAYCAST_HISTORY_CHAR_CAP } from "./lib/db";

export default async function Command() {
  const text = await Clipboard.readText();
  if (!text || text.length <= RAYCAST_HISTORY_CHAR_CAP) return;
  await saveClip({ text });
  await evictOldEntries();
}
