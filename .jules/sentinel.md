## 2026-01-16 - [CRITICAL] Sensitive File Exposure in Static Server
**Vulnerability:** `server.js` was serving all files in the root directory, including source code (`server.js`), configuration (`package.json`, `Dockerfile`), and logs (`server.log`).
**Learning:** Custom static file servers using `fs` must explicitly deny access to sensitive files and hidden files (dotfiles). Defaulting to serving everything in `process.cwd()` exposes the entire codebase and secrets.
**Prevention:** Implemented a deny-list for sensitive filenames and a check for dotfiles in `server.js`. Hardened directory traversal check to ensure paths resolve strictly within the intended directory.

## 2026-01-17 - [HIGH] Static Server Access Hardening (Whitelist Strategy)
**Vulnerability:** Reliance on a blacklist for sensitive files left unexpected file types (e.g., `.backup`, `.log`, `.md` in subfolders) exposed.
**Learning:** Blacklisting is fragile because it requires anticipating every possible sensitive filename. A "default deny" strategy using an extension whitelist is superior for static file servers.
**Prevention:** Updated `server.js` to enforce a strict allowed-extension whitelist (e.g., only `.html`, `.js`, `.css`, `.png`, etc.) and explicitly blocked internal directories (`docs`, `_deprecated`, `node_modules`).

## 2026-01-18 - [MEDIUM] Incomplete Array Validation in Save Loader
**Vulnerability:** The save file validator checked only the first element of entity arrays (`units[0]`), allowing malicious or malformed data in subsequent indices to bypass checks.
**Learning:** Sampling-based validation (checking index 0) provides a false sense of security. Attackers can easily craft payloads where the first item is valid but subsequent items contain malicious data or exploits.
**Prevention:** Implemented O(N) validation that iterates through every element in input arrays. Added explicit length limits to prevent Denial of Service via memory exhaustion.

## 2026-01-22 - [MEDIUM] Incomplete Sensitive File Blocklist
**Vulnerability:** The server blocked common sensitive files but missed `yarn.lock`, `.npmrc`, `.nvmrc` and the `test-results` directory, potentially exposing dependency versions, private registry configurations, and test artifacts.
**Learning:** Blocklists in custom servers often lag behind project evolution (e.g. switching package managers or adding new build artifacts).
**Prevention:** Expanded the blocklist in `server.js` and added `test-results` to the directory deny-list. Regular security audits of file structure changes are necessary when using custom file servers.

## 2026-01-26 - [MEDIUM] Unhandled Stream Errors in Static Server
**Vulnerability:** `server.js` used `fs.createReadStream().pipe(res)` without an error handler on the read stream. If a file became unreadable after the `fs.stat` check (e.g., race condition, I/O error), the unhandled `error` event would crash the Node.js process, causing a Denial of Service.
**Learning:** In Node.js, streams emit `error` events that must be handled. Relying on an initial `fs.stat` check is insufficient because it doesn't guarantee the stream creation or reading will succeed (TOCTOU).
**Prevention:** Added `.on('error', ...)` handler to the read stream to catch errors and return a 500 status code, preventing process crashes. Also added a `clientError` handler for robustness against malformed requests.
