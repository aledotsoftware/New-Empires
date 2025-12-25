# Sentinel Journal
## 2024-05-23 - DOM Injection Vulnerability in UI Panels
**Vulnerability:** Found `innerHTML` usage in `updateSelectionPanel` and `updateActionsPanel` injecting dynamic data (entity names, properties).
**Learning:** Even internal data should be treated as untrusted in UI rendering to prevent future XSS if data sources change (e.g., user input, mods).
**Prevention:** Refactored to use `document.createElement`, `textContent`, and `appendChild`. Banned `innerHTML` for dynamic content.
## 2024-05-23 - XSS Remediation in Tech Tree
**Vulnerability:** XSS vulnerability found in `main.js` where `innerHTML` was used to render the technology tree, allowing potential injection of malicious scripts if technology data was compromised or manipulated.
**Learning:** Even when rendering internal data, using `innerHTML` is a security risk. Refactoring to standard DOM creation methods (`createElement`, `textContent`, `appendChild`) is a robust defense.
**Prevention:** Strictly enforce the prohibition of `innerHTML` for rendering dynamic content. Use helper functions like `createSafeIconElement` and standard DOM APIs.
