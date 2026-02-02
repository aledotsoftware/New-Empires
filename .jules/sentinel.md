## 2024-05-21 - Case Insensitivity in File Blocking
**Vulnerability:** Sensitive files (e.g., `server.js`, `.env`) and directories (e.g., `.git`, `docs`) could be accessed on case-insensitive filesystems (Windows, macOS) by requesting them with different casing (e.g., `/SERVER.JS`), bypassing the exact-match blocklist.
**Learning:** Node.js `fs` module operations are case-insensitive on Windows/macOS. Security blocklists based on filename strings must account for this behavior, even if the development environment is Linux.
**Prevention:** Always use `.toLowerCase()` (or locale-aware comparison) when checking filenames against a blocklist of sensitive resources.

## 2024-05-23 - Unbounded Memory in Rate Limiter
**Vulnerability:** The in-memory rate limiter (`ipCounts` Map) had no size limit. An attacker could exhaust server memory (DoS) by sending requests from millions of spoofed IPs (e.g., via `X-Forwarded-For` with `TRUST_PROXY` enabled).
**Learning:** In-memory storage for unauthenticated user data must always be bounded to prevent resource exhaustion attacks.
**Prevention:** Implement a hard cap on the Map size (e.g., 10k entries) and use an eviction strategy (like FIFO or LRU) to discard old entries when full.
