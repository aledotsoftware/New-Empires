# Palette's Journal

## 2024-05-22 - Replacing Native Alerts
**Learning:** Native browser alerts (`alert`, `confirm`) break immersion and are blocking, which is bad for game loops. They also lack styling and consistent keyboard support.
**Action:** Replace `confirm()` with a custom generic modal that reuses existing CSS classes (`.modal-overlay`, `.btn-secondary`) for visual consistency and better control over focus management.
