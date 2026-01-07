## 2024-05-23 - Visual Feedback for Disabled States
**Learning:** Providing specific visual feedback on *why* an action is disabled (e.g., highlighting missing resources in red within the tooltip) significantly improves user understanding compared to a generic disabled state.
**Action:** When disabling UI elements due to resource constraints, dynamically style the cost display to indicate exactly which resources are insufficient.
## 2024-05-24 - Detailed Accessibility Feedback
**Learning:** Adding specific context to `aria-label` (e.g., 'Insuficiente: wood (30)') along with a visual warning significantly improves the usability of disabled states for both screen reader and visual users.
**Action:** When disabling elements due to specific conditions, dynamically update the ARIA label to explain the *reason* and ensure a visual indicator is also present.
