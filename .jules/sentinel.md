## 2025-05-20 - Legacy Code XSS
**Vulnerability:** Found `innerHTML` usage with string interpolation of `entity.name` and `entity.icon` in `game.js` (legacy).
**Learning:** Legacy files kept for compatibility can remain a security risk even if the main application logic has migrated to modern, secure patterns. Shadowed or "dead" code that is still loaded in the browser is still an attack surface.
**Prevention:** Always refactor or remove legacy code that contains security vulnerabilities. If removal is not possible, apply the same security standards (DOM creation vs innerHTML) as the main codebase.
