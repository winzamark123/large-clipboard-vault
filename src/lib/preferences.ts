import { getPreferenceValues } from "@raycast/api";

type Raw = { maxEntries?: string };

export function getMaxEntries() {
  const raw = getPreferenceValues<Raw>().maxEntries ?? "500";
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 500;
  return parsed;
}
