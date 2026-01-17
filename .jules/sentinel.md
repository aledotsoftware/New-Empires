## 2026-01-16 - [CRITICAL] Sensitive File Exposure in Static Server
**Vulnerability:** `server.js` was serving all files in the root directory, including source code (`server.js`), configuration (`package.json`, `Dockerfile`), and logs (`server.log`).
**Learning:** Custom static file servers using `fs` must explicitly deny access to sensitive files and hidden files (dotfiles). Defaulting to serving everything in `process.cwd()` exposes the entire codebase and secrets.
**Prevention:** Implemented a deny-list for sensitive filenames and a check for dotfiles in `server.js`. Hardened directory traversal check to ensure paths resolve strictly within the intended directory.

## 2026-01-17 - [HIGH] Static Server Access Hardening (Whitelist Strategy)
**Vulnerability:** Reliance on a blacklist for sensitive files left unexpected file types (e.g., `.backup`, `.log`, `.md` in subfolders) exposed.
**Learning:** Blacklisting is fragile because it requires anticipating every possible sensitive filename. A "default deny" strategy using an extension whitelist is superior for static file servers.
**Prevention:** Updated `server.js` to enforce a strict allowed-extension whitelist (e.g., only `.html`, `.js`, `.css`, `.png`, etc.) and explicitly blocked internal directories (`docs`, `_deprecated`, `node_modules`).
