import { Action, ActionPanel, Clipboard, Detail, Icon, useNavigation } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { evictOldEntries, saveClip } from "./lib/capture";

const PREVIEW_LIMIT = 600;

export default function Command() {
  const { pop } = useNavigation();
  const { isLoading, data } = usePromise(async () => {
    const text = await Clipboard.readText();
    if (!text) return { kind: "empty" } as const;
    const { saved, charCount } = await saveClip({ text });
    if (saved) await evictOldEntries();
    return { kind: "ok", saved, charCount, preview: text.slice(0, PREVIEW_LIMIT) } as const;
  });

  if (isLoading || !data) {
    return <Detail isLoading markdown="Saving current clipboard…" />;
  }

  if (data.kind === "empty") {
    return (
      <Detail
        markdown={`# Clipboard is empty\n\nNothing to save.`}
        actions={
          <ActionPanel>
            <Action title="Close" icon={Icon.Xmark} onAction={pop} />
          </ActionPanel>
        }
      />
    );
  }

  const headline = data.saved ? "Saved to vault" : "Already in vault";
  const truncated = data.preview.length < data.charCount;
  const markdown = `# ${headline}\n\n**${data.charCount.toLocaleString()} characters**\n\n---\n\n\`\`\`\n${data.preview}${truncated ? "\n…" : ""}\n\`\`\``;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action title="Done" icon={Icon.Check} onAction={pop} />
        </ActionPanel>
      }
    />
  );
}
