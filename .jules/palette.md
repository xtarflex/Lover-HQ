## 2026-08-11 - Adding Accessible Labels for Screen Readers
**Learning:** Auth forms and inputs often use placeholder text visually but omit explicitly linked `<label>` tags, which creates critical barriers for screen reader users trying to identify the fields.
**Action:** Add visually hidden labels using Tailwind's `sr-only` class and link them via `htmlFor` and `id` to the respective inputs to ensure full screen reader support without breaking the visual design.
