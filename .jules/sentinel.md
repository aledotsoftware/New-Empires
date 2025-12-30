# Sentinel Journal - Security Learnings

## 2024-05-23 - DOM XSS via Tooltip Generation
**Vulnerability:** `innerHTML` used in `updateActionsPanel` to construct tooltips included dynamic data (`buttonData.label`) which could be an XSS vector if data sources (like tech names) are tainted.
**Learning:** Even internal data sources should be treated as untrusted when rendering to the DOM, especially if modding support is planned.
**Prevention:** Always use `textContent` or explicit `document.createElement` + `appendChild` for dynamic content, never `innerHTML`.
