# Palette's Journal - UX & Accessibility

## 2024-05-23 - Selection Empty State & Tips
**Learning:** Empty states are prime real estate for onboarding and guidance. The selection panel's "Nothing selected" state was a missed opportunity to educate the user.
**Action:** Implemented a "Tip of the Moment" feature that cycles through helpful gameplay tips when nothing is selected. This transforms a dead space into a passive learning channel, improving the onboarding experience for new RTS players. Used `aria-live="polite"` to ensure screen readers are aware of these updates without being overwhelmed.

## 2025-05-24 - Nested Modal Focus Management
**Learning:** The existing `FocusManager` used a single `previousActiveElement` variable, which failed to restore focus correctly when modals were nested (e.g., Confirmation dialog over Settings).
**Action:** Upgraded `FocusManager` to use a `focusStack`. This ensures focus is restored to the correct element in reverse order of opening, preserving the keyboard navigation flow through multiple layers of UI.
