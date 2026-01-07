## 2024-05-23 - Visual Feedback for Disabled States
**Learning:** Providing specific visual feedback on *why* an action is disabled (e.g., highlighting missing resources in red within the tooltip) significantly improves user understanding compared to a generic disabled state.
**Action:** When disabling UI elements due to resource constraints, dynamically style the cost display to indicate exactly which resources are insufficient.

## 2026-01-07 - Specific Error Messaging for Action Buttons
**Learning:** Generic disabled states often mask distinct failure modes (e.g., "Population Limit" vs "Insufficient Resources"). Users need to know specifically *why* an action is blocked to take corrective action.
**Action:** When an action can be disabled for multiple reasons, the UI should explicitly prioritize and display the specific blocking condition (e.g., in a tooltip or status message) rather than a generic "Disabled" state.
