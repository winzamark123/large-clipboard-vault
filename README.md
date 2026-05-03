# Large Clip Vault

A Raycast extension for stashing and searching large text snippets that exceed Raycast's built-in clipboard history limits.

## Why

Raycast's clipboard history is great for short snippets but truncates or skips very large text payloads (long log dumps, full files, multi-page prompts). This extension acts as a side vault: it captures large clips you explicitly want to keep and lets you search and paste them back later.

## Status

Early development. The manifest currently registers a single `no-view` command as a placeholder. Planned commands:

- **Watch Clipboard** (`no-view`, background) — captures clips above a configurable size threshold into the vault.
- **Search Vault** (`view`) — list, preview, copy, paste, and delete saved clips.

## Requirements

- macOS or Windows (per the manifest's `platforms` field)
- Node.js `>= 22.22.2` (matches `@raycast/api`'s engine requirement)
- npm (Raycast's CI uses npm; the committed `package-lock.json` must stay in sync)
- Raycast app

## Development

```bash
npm install
npm run dev
```

`npm run dev` starts Raycast in development mode with hot reload. The extension appears in your Raycast root search while `dev` is running.

Other scripts:

| Script | Purpose |
| --- | --- |
| `npm run build` | Validate the extension build (same checks the Store CI runs). |
| `npm run lint` | Lint with `@raycast/eslint-config`. |
| `npm run fix-lint` | Auto-fix lint issues. |
| `npm run publish` | Open a PR to the Raycast Store (only when ready). |

## Project layout

```
large-clip-vault/
├── assets/                 # icons used by the manifest
├── src/                    # command entrypoints (one file per command)
├── package.json            # Raycast manifest + npm metadata
├── tsconfig.json
└── eslint.config.js
```

Each entry in `package.json#commands` maps to a file in `src/` with the same `name`.

## Contributing

This is a personal extension; not currently accepting external contributions. Issues and ideas are welcome.

## License

MIT
