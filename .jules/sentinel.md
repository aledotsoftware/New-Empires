## 2024-05-21 - Case Insensitivity in File Blocking
**Vulnerability:** Sensitive files (e.g., `server.js`, `.env`) and directories (e.g., `.git`, `docs`) could be accessed on case-insensitive filesystems (Windows, macOS) by requesting them with different casing (e.g., `/SERVER.JS`), bypassing the exact-match blocklist.
**Learning:** Node.js `fs` module operations are case-insensitive on Windows/macOS. Security blocklists based on filename strings must account for this behavior, even if the development environment is Linux.
**Prevention:** Always use `.toLowerCase()` (or locale-aware comparison) when checking filenames against a blocklist of sensitive resources.
