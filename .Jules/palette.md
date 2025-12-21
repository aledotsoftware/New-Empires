## 2024-05-23 - Accessibility in Empty States
**Learning:** Empty state UI elements (like placeholder buttons) still need accessibility attributes (aria-disabled, aria-label) to prevent screen reader confusion and maintain a consistent navigation experience.
**Action:** Always ensure placeholder or disabled interactive elements have aria-disabled='true' and descriptive aria-labels indicating their empty state.

## 2024-05-23 - Dynamic ID Confusion
**Learning:** Legacy IDs in JS code (e.g. `actionsGrid`) can silently fail if the HTML structure has changed (e.g. to `commandPanel`), leading to features appearing "broken" or unstyled.
**Action:** Always verify DOM IDs against the current HTML structure before modifying JS logic, especially in legacy codebases.
