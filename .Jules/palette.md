# Palette's Journal - UX & Accessibility

## 2024-05-23 - Selection Empty State & Tips
**Learning:** Empty states are prime real estate for onboarding and guidance. The selection panel's "Nothing selected" state was a missed opportunity to educate the user.
**Action:** Implemented a "Tip of the Moment" feature that cycles through helpful gameplay tips when nothing is selected. This transforms a dead space into a passive learning channel, improving the onboarding experience for new RTS players. Used `aria-live="polite"` to ensure screen readers are aware of these updates without being overwhelmed.

## 2024-05-24 - Build Ghost Accessibility
**Learning:** Relying solely on color (Red vs Green) to indicate state (Invalid vs Valid placement) is a critical accessibility failure for colorblind users and can be ambiguous on complex terrain backgrounds.
**Action:** Enhanced the building placement preview ("ghost") to include a high-contrast symbol ('🚫') and a clear text label ("Occupied" or "Invalid Terrain") when placement is forbidden. This ensures the feedback is communicated through multiple channels (Color + Shape + Text), making the core mechanic of building accessible to everyone.
