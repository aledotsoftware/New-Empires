# Sentinel Journal
## 2024-05-23 - DOM Injection Vulnerability in UI Panels
**Vulnerability:** Found `innerHTML` usage in `updateSelectionPanel` and `updateActionsPanel` injecting dynamic data (entity names, properties).
**Learning:** Even internal data should be treated as untrusted in UI rendering to prevent future XSS if data sources change (e.g., user input, mods).
**Prevention:** Refactored to use `document.createElement`, `textContent`, and `appendChild`. Banned `innerHTML` for dynamic content.
