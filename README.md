# Large Clip Vault

Raycast extension that vaults clipboard text larger than Raycast's built-in clipboard history can store.

## Why

Raycast's clipboard history caps each entry at **32,768 characters** ([manual](https://manual.raycast.com/clipboard-history), [issue #16573](https://github.com/raycast/extensions/issues/16573)). Anything larger — long log dumps, full files, multi-page prompts — never makes it in. This extension picks up that slack: a side vault for clips above the cap, with search and paste-back.

## Commands

| Command | Mode | What it does |
| --- | --- | --- |
| **Watch Clipboard** | background, every 10s | Saves the current clipboard to the vault if it exceeds 32,768 characters. |
| **Save Current Clipboard** | view | Manually save the current clipboard regardless of size. Fallback for when the watcher misses a clip (e.g. you copied two big things in quick succession). |
| **Search Vault** | view | Search by content substring, copy/paste back, view full content, or delete. |

## Storage

Clips are stored in a local SQLite database under Raycast's per-extension support directory (`environment.supportPath`). Dedupe is by SHA-256 of content, so re-copying the same large text doesn't create duplicates.

## Preferences

| Preference | Default | Notes |
| --- | --- | --- |
| Max Entries | `500` | Older clips are evicted once the vault exceeds this count. |

The 32,768-char watcher threshold is intentionally not configurable — it tracks Raycast's built-in cap so the vault stays purpose-built for what Raycast can't store.

## Requirements

- macOS
- Node.js `>= 22.22.2`
- npm (Raycast's CI requires it; `package-lock.json` is committed)
- Raycast app

## Development

```bash
npm install
npm run dev
```

Other scripts:

| Script | Purpose |
| --- | --- |
| `npm run build` | Validate the extension build (same checks the Store CI runs). |
| `npm run lint` | Lint with `@raycast/eslint-config`. |
| `npm run fix-lint` | Auto-fix lint issues. |
| `npm run publish` | Open a PR to the Raycast Store. |

## Project layout

```
large-clip-vault/
├── src/
│   ├── watch-clipboard.ts      # background watcher (no-view, 10s)
│   ├── save-clipboard.tsx      # manual save (view)
│   ├── search-vault.tsx        # search + actions (view)
│   └── lib/
│       ├── db.ts               # path, schema, escape helper
│       ├── capture.ts          # shared save + evict
│       └── preferences.ts      # typed preference access
├── package.json
└── tsconfig.json
```

## License

MIT
