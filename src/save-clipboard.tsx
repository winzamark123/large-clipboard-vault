import { Action, ActionPanel, Detail, Icon, useNavigation } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { captureFromClipboard } from "./lib/capture";

export default function Command() {
  const { pop } = useNavigation();
  const { isLoading, data } = usePromise(() => captureFromClipboard({ requireLarge: false }));

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

  // requireLarge: false means "below-threshold" never returns from this code path
  if (data.kind === "below-threshold") {
    return <Detail markdown="Unexpected state." />;
  }

  const headline = data.kind === "saved" ? "Saved to vault" : "Already in vault";
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
