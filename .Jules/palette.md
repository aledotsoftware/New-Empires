## 2024-05-23 - Visual Feedback for Disabled States
**Learning:** Providing specific visual feedback on *why* an action is disabled (e.g., highlighting missing resources in red within the tooltip) significantly improves user understanding compared to a generic disabled state.
**Action:** When disabling UI elements due to resource constraints, dynamically style the cost display to indicate exactly which resources are insufficient.
## 2024-05-24 - Detailed Accessibility Feedback
**Learning:** Adding specific context to `aria-label` (e.g., 'Insuficiente: wood (30)') along with a visual warning significantly improves the usability of disabled states for both screen reader and visual users.
**Action:** When disabling elements due to specific conditions, dynamically update the ARIA label to explain the *reason* and ensure a visual indicator is also present.

## 2024-05-24 - Hidden Affordances
**Learning:** Robust functionality (like keyboard shortcuts) often exists in the codebase but remains "dead code" to the user if not surfaced in the UI. Discovery is as important as implementation.
**Action:** When auditing UI, always check input handlers (keydown listeners) for hidden features that can be surfaced with simple visual badges.

## 2025-01-09 - Actionable Error Messages
**Learning:** Generic error messages like "Insufficient resources" force users to calculate what they need. Providing the specific missing amount (e.g., "Missing: Food (50)") reduces cognitive load and makes the interface more actionable.
**Action:** Always calculate and display the *delta* (what is missing) in error states involving quantitative constraints.
