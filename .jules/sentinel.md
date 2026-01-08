# Sentinel Journal

## 2024-05-24 - HTML Injection in Tooltips
**Vulnerability:** The `createButtonTooltip` function was using `innerHTML` to inject `buttonData.label`, which could allow XSS if the label came from an untrusted source or was manipulated.
**Learning:** Even in a client-side game, assuming data integrity is dangerous. "Legacy" code often contains these patterns.
**Prevention:** Always use `textContent` or `document.createTextNode` for text content. Use `document.createElement` for structure.

## 2024-05-24 - InnerHTML Vulnerabilities
**Vulnerability:** The `renderCivilizationSelection` and `renderTechTree` functions were using `innerHTML` to build complex UI components, creating a large surface area for XSS.
**Learning:** Constructing complex UI with `innerHTML` is a common anti-pattern in vanilla JS projects.
**Prevention:** Refactor to use `document.createElement` and `appendChild`. It's more verbose but secure and easier to debug.

## 2024-05-25 - DOM-based XSS in Notification System
**Vulnerability:** The `showNotification` function was using `innerHTML` to render messages.
**Learning:** Notifications often take dynamic input (like entity names). If an entity name is user-controlled (e.g. in multiplayer) or malformed, it triggers XSS.
**Prevention:** Switched to `document.createElement` and `textContent`.

## 2024-05-25 - Unsanitized Icon Rendering
**Vulnerability:** The `renderIconElement` helper returned an HTML string (`<img ...>`), which was then often used with `innerHTML`.
**Learning:** Helper functions that return HTML strings encourage the use of `innerHTML` in consumer code.
**Prevention:** Replaced with `createIconElement` which returns a DOM Node. This forces consumers to use `appendChild`.
