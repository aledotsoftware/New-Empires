## 2026-01-16 - [CRITICAL] Sensitive File Exposure in Static Server
**Vulnerability:** `server.js` was serving all files in the root directory, including source code (`server.js`), configuration (`package.json`, `Dockerfile`), and logs (`server.log`).
**Learning:** Custom static file servers using `fs` must explicitly deny access to sensitive files and hidden files (dotfiles). Defaulting to serving everything in `process.cwd()` exposes the entire codebase and secrets.
**Prevention:** Implemented a deny-list for sensitive filenames and a check for dotfiles in `server.js`. Hardened directory traversal check to ensure paths resolve strictly within the intended directory.
