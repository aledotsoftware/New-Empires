# Palette's Journal - UX & Accessibility

## 2024-05-23 - Selection Empty State & Tips
**Learning:** Empty states are prime real estate for onboarding and guidance. The selection panel's "Nothing selected" state was a missed opportunity to educate the user.
**Action:** Implemented a "Tip of the Moment" feature that cycles through helpful gameplay tips when nothing is selected. This transforms a dead space into a passive learning channel, improving the onboarding experience for new RTS players. Used `aria-live="polite"` to ensure screen readers are aware of these updates without being overwhelmed.

## 2026-01-16 - Actionable Empty States
**Learning:** Passive tips are helpful, but actionable buttons in empty states significantly improve flow. Players often "lose" their place; giving them a "Reset to Center" or "Find Idle" button directly in the empty state reduces cognitive load.
**Action:** Added "Quick Actions" (Town Center, Idle Villager) to the empty selection panel. This converts a "dead end" UI state into a navigation hub.
