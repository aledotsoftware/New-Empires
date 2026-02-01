## 2024-05-21 - Case Insensitivity in File Blocking
**Vulnerability:** Sensitive files (e.g., `server.js`, `.env`) and directories (e.g., `.git`, `docs`) could be accessed on case-insensitive filesystems (Windows, macOS) by requesting them with different casing (e.g., `/SERVER.JS`), bypassing the exact-match blocklist.
**Learning:** Node.js `fs` module operations are case-insensitive on Windows/macOS. Security blocklists based on filename strings must account for this behavior, even if the development environment is Linux.
**Prevention:** Always use `.toLowerCase()` (or locale-aware comparison) when checking filenames against a blocklist of sensitive resources.

## 2026-02-01 - Root-Level Data Exposure
**Vulnerability:** The server used an allow-list for file extensions (MIME types) but did not restrict where those files could be served from. This meant that if a sensitive file (e.g., `config.json` or `notes.txt`) with an allowed extension was accidentally placed in the root directory, it was publicly accessible.
**Learning:** Default-allow policies for extensions are insufficient without directory-based restrictions. Static file servers should strictly limit which directories can serve "data" files like JSON or TXT, especially in the application root where config files often reside.
**Prevention:** Explicitly block sensitive extensions (`.json`, `.txt`) in the root directory unless they are strictly required (like `manifest.json`), or better, serve static assets only from a dedicated `public/` subdirectory.
