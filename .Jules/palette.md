## 2024-05-23 - Visual Feedback for Disabled States
**Learning:** Providing specific visual feedback on *why* an action is disabled (e.g., highlighting missing resources in red within the tooltip) significantly improves user understanding compared to a generic disabled state.
**Action:** When disabling UI elements due to resource constraints, dynamically style the cost display to indicate exactly which resources are insufficient.

## 2024-05-24 - Detailed Accessibility Feedback
**Learning:** Adding specific context to `aria-label` (e.g., 'Insuficiente: wood (30)') along with a visual warning significantly improves the usability of disabled states for both screen reader and visual users.
**Action:** When disabling elements due to specific conditions, dynamically update the ARIA label to explain the *reason* and ensure a visual indicator is also present.

## 2024-05-24 - Hidden Affordances
**Learning:** Robust functionality (like keyboard shortcuts) often exists in the codebase but remains "dead code" to the user if not surfaced in the UI. Discovery is as important as implementation.
**Action:** When auditing UI, always check input handlers (keydown listeners) for hidden features that can be surfaced with simple visual badges.

## 2024-05-25 - Status Visibility & Contextual Shortcuts
**Learning:** Users often miss powerful features (like the "Tab" key for idle villagers) if they are invisible status indicators. Surfacing these features as visible UI elements (that appear only when relevant) provides both a reminder of the shortcut and a clickable alternative for mouse users.
**Action:** When a game state is inefficient (e.g., idle workers), show a prominent, actionable indicator that solves the problem, and include the keyboard shortcut in its label.

## 2024-05-25 - Resource Context & Focus
**Learning:** Static HUD elements (like resource counters) often lack context for new players. While `aria-labelledby` connects labels, it doesn't make the element interactive. Adding `tabindex="0"` converts these into focusable "info cards" without changing visual layout.
**Action:** Make critical HUD stats focusable and attach tooltips that explain *gameplay utility* (e.g., "Wood: Used for buildings") rather than just stating the name.
