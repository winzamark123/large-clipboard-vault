# Large Clipboard Vault Changelog

## [Initial Version] - {PR_MERGE_DATE}

- Add **Watch Clipboard** background command that captures clips above Raycast's 32,768-character clipboard history cap every 10 seconds.
- Add **Save Current Clipboard** view command for explicit, no-threshold capture as a fallback when the watcher misses a clip.
- Add **Search Vault** view command with substring search, paste-back, copy-back, full-content detail view, and delete actions. Also captures the current clipboard on open so a freshly copied large clip is searchable instantly.
- Store clips locally in SQLite via Node's built-in `node:sqlite` under the extension's support directory, keyed on a SHA-256 fingerprint for atomic dedupe.
- Add **Max Entries** preference (default 500) for vault size capping with oldest-first eviction.
