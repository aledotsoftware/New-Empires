## 2024-05-22 - Resource Panel Accessibility
**Learning:** Native `title` attributes are insufficient for screen readers and keyboard users as they often don't appear on focus and can't be styled.
**Action:** Replace native tooltips with custom DOM-based tooltips or persistent visible labels where possible. For resource panels, adding `aria-label` to the container provides immediate context without requiring interaction.

## 2024-05-22 - Handling Mixed Data Types in Legacy UI
**Learning:** Legacy UI components often receive data in inconsistent formats (e.g., cost as string vs object).
**Action:** Implement type checking (typeof) or normalization helpers when rendering these fields to ensure robust display across different data sources.
## 2024-05-22 - Robust Cost Rendering
**Learning:** To prevent regressions when handling mixed data types (string vs object) in legacy UI code, always implement explicit type checks before iterating.
**Action:** Update `js/core/Game.js` to mirror the robust cost rendering logic (handling both string and object types) added to `game.js`.
