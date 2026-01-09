## 2024-05-23 - Visual Feedback for Disabled States
**Learning:** Providing specific visual feedback on *why* an action is disabled (e.g., highlighting missing resources in red within the tooltip) significantly improves user understanding compared to a generic disabled state.
**Action:** When disabling UI elements due to resource constraints, dynamically style the cost display to indicate exactly which resources are insufficient.
## 2024-05-24 - Detailed Accessibility Feedback
**Learning:** Adding specific context to `aria-label` (e.g., 'Insuficiente: wood (30)') along with a visual warning significantly improves the usability of disabled states for both screen reader and visual users.
**Action:** When disabling elements due to specific conditions, dynamically update the ARIA label to explain the *reason* and ensure a visual indicator is also present.

## 2024-05-24 - Hidden Affordances
**Learning:** Robust functionality (like keyboard shortcuts) often exists in the codebase but remains "dead code" to the user if not surfaced in the UI. Discovery is as important as implementation.
**Action:** When auditing UI, always check input handlers (keydown listeners) for hidden features that can be surfaced with simple visual badges.

## 2024-05-23 - [Improved Resource Visibility]
**Learning:** Adding accessible tooltips with context (what the resource is for) directly to the main HUD elements greatly improves learnability for new players without cluttering the interface. Using `tabindex="0"` makes these information bits accessible to keyboard users who might otherwise skip the top bar.
**Action:** Always check if core game stats (like resources) have explanations available on hover/focus, not just in menus.
