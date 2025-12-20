## 2024-05-23 - Accessibility Patterns in Vanilla JS
**Learning:** The codebase relies on CSS classes (e.g., `.disabled`) for button states rather than native attributes (`disabled`). This keeps buttons focusable and clickable, requiring custom JS checks and confusing screen readers.
**Action:** When working with vanilla JS codebases like this, always check for class-based state management and enhance it with ARIA attributes (`aria-disabled="true"`) rather than changing the logic to use native attributes, which might break existing event listeners.

**Learning:** Icon-only buttons (like 'X' for close or settings gears) often lack `aria-label`, making them invisible or confusing to screen reader users.
**Action:** Systematically audit `index.html` and dynamic UI generators for icon-only buttons and add descriptive `aria-label` attributes.
