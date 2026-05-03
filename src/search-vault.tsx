import {
  Action,
  ActionPanel,
  Alert,
  Clipboard,
  confirmAlert,
  Detail,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { executeSQL, usePromise } from "@raycast/utils";
import { useState } from "react";
import { ClipContentRow, ClipRow, dbPath, ensureSchema, sqlText } from "./lib/db";

const LIST_LIMIT = 200;

export default function Command() {
  const [searchText, setSearchText] = useState("");

  const { isLoading, data, revalidate } = usePromise(
    async (q: string) => {
      await ensureSchema();
      const where = q.trim().length > 0 ? `WHERE content LIKE ${sqlText("%" + q + "%")}` : "";
      return executeSQL<ClipRow>(
        dbPath,
        `SELECT id, preview, char_count, created_at FROM clips
         ${where}
         ORDER BY created_at DESC
         LIMIT ${LIST_LIMIT}`,
      );
    },
    [searchText],
  );

  const rows = data ?? [];

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search vault…"
      throttle
    >
      {!isLoading && rows.length === 0 ? (
        <List.EmptyView
          icon={Icon.Tray}
          title={searchText ? "No matches" : "Vault is empty"}
          description={
            searchText
              ? "Try a different search."
              : "Copy something larger than 32,768 characters and the watcher will catch it within ~10 seconds."
          }
        />
      ) : (
        rows.map((row) => <ClipItem key={row.id} row={row} onChanged={revalidate} />)
      )}
    </List>
  );
}

function ClipItem({ row, onChanged }: { row: ClipRow; onChanged: () => void }) {
  const flatPreview = row.preview.replace(/\s+/g, " ").trim();
  return (
    <List.Item
      title={flatPreview || "(whitespace only)"}
      accessories={[{ text: `${row.char_count.toLocaleString()} chars` }, { date: new Date(row.created_at) }]}
      actions={
        <ActionPanel>
          <Action title="Paste to Active App" icon={Icon.Document} onAction={() => pasteClip(row.id)} />
          <Action
            title="Copy to Clipboard"
            icon={Icon.Clipboard}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
            onAction={() => copyClip(row.id)}
          />
          <Action.Push
            title="Show Full Content"
            icon={Icon.Eye}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
            target={<ClipDetail id={row.id} />}
          />
          <Action
            title="Delete"
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            shortcut={{ modifiers: ["ctrl"], key: "x" }}
            onAction={() => deleteClip({ id: row.id, onChanged })}
          />
          <Action
            title="Refresh"
            icon={Icon.RotateClockwise}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={onChanged}
          />
        </ActionPanel>
      }
    />
  );
}

function ClipDetail({ id }: { id: number }) {
  const { isLoading, data } = usePromise(async () => {
    const rows = await executeSQL<ClipContentRow>(dbPath, `SELECT content FROM clips WHERE id = ${id}`);
    return rows[0]?.content ?? "";
  });

  const content = data ?? "";
  const markdown = isLoading ? "Loading…" : `\`\`\`\n${content}\n\`\`\``;

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action title="Copy to Clipboard" icon={Icon.Clipboard} onAction={() => Clipboard.copy(content)} />
          <Action title="Paste to Active App" icon={Icon.Document} onAction={() => Clipboard.paste(content)} />
        </ActionPanel>
      }
    />
  );
}

async function fetchContent(id: number) {
  const rows = await executeSQL<ClipContentRow>(dbPath, `SELECT content FROM clips WHERE id = ${id}`);
  return rows[0]?.content;
}

async function copyClip(id: number) {
  const content = await fetchContent(id);
  if (!content) {
    await showToast({ style: Toast.Style.Failure, title: "Clip not found" });
    return;
  }
  await Clipboard.copy(content);
  await showToast({ title: "Copied", message: `${content.length.toLocaleString()} chars` });
}

async function pasteClip(id: number) {
  const content = await fetchContent(id);
  if (!content) {
    await showToast({ style: Toast.Style.Failure, title: "Clip not found" });
    return;
  }
  await Clipboard.paste(content);
}

async function deleteClip({ id, onChanged }: { id: number; onChanged: () => void }) {
  const confirmed = await confirmAlert({
    title: "Delete clip?",
    message: "This cannot be undone.",
    primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
  });
  if (!confirmed) return;
  await executeSQL(dbPath, `DELETE FROM clips WHERE id = ${id}`);
  await showToast({ title: "Deleted" });
  onChanged();
}
