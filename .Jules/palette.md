## 2024-10-24 - Global Focus Visibility
**Learning:** Adding a global `:focus-visible` style with `outline` and `box-shadow` drastically improves keyboard navigation feedback without cluttering the UI for mouse users.
**Action:** Ensure all future interactive elements (buttons, inputs) inherit or respect this global focus style, and test tab-order navigation on new screens.

## 2024-05-22 - Resource Panel Accessibility
**Learning:** Native `title` attributes are insufficient for screen readers and keyboard users as they often don't appear on focus and can't be styled.
**Action:** Replace native tooltips with custom DOM-based tooltips or persistent visible labels where possible. For resource panels, adding `aria-label` to the container provides immediate context without requiring interaction.

## 2024-05-22 - Handling Mixed Data Types in Legacy UI
**Learning:** Legacy UI components often receive data in inconsistent formats (e.g., cost as string vs object).
**Action:** Implement type checking (typeof) or normalization helpers when rendering these fields to ensure robust display across different data sources.
