## 2024-05-22 - Resource Panel Accessibility
**Learning:** Native `title` attributes are insufficient for screen readers and keyboard users as they often don't appear on focus and can't be styled.
**Action:** Replace native tooltips with custom DOM-based tooltips or persistent visible labels where possible. For resource panels, adding `aria-label` to the container provides immediate context without requiring interaction.
