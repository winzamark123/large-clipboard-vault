import { Action, ActionPanel, Clipboard, Detail, Icon, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { saveClip, evictOldEntries } from "./lib/capture";

type State =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ok"; charCount: number; saved: boolean; preview: string };

export default function Command() {
  const { pop } = useNavigation();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    (async () => {
      const text = await Clipboard.readText();
      if (!text) {
        setState({ status: "empty" });
        return;
      }
      const { saved, charCount } = await saveClip({ text });
      await evictOldEntries();
      setState({ status: "ok", charCount, saved, preview: text.slice(0, 600) });
    })();
  }, []);

  if (state.status === "loading") {
    return <Detail isLoading markdown="Saving current clipboard…" />;
  }

  if (state.status === "empty") {
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

  const headline = state.saved ? "Saved to vault" : "Already in vault";
  const markdown = `# ${headline}\n\n**${state.charCount.toLocaleString()} characters**\n\n---\n\n\`\`\`\n${state.preview}${state.preview.length < state.charCount ? "\n…" : ""}\n\`\`\``;

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
