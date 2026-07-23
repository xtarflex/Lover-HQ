## 2024-07-23 - Form Accessibility for Screen Readers
**Learning:** Relying solely on placeholders for form fields is a major accessibility anti-pattern. Screen readers require explicit `<label>` elements linked to inputs via `htmlFor` and `id` attributes.
**Action:** Always ensure every form input has an associated `<label>`. If a visual label breaks the design, use a visually hidden label with `className="sr-only"`.
