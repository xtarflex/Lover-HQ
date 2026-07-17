## 2024-07-08 - Accessible Custom Toggles
**Learning:** Custom UI toggle switches (often implemented as `<button>` elements with Tailwind CSS like `h-6 w-11 rounded-full`) lack inherent semantic meaning for screen readers. They need explicit ARIA roles and states.
**Action:** When creating or modifying custom toggle switches, always ensure they have `role="switch"`, an accurate `aria-checked` boolean state, and a descriptive `aria-label` to provide proper context and feedback to assistive technologies.
## 2024-05-18 - Avoid redundant aria-labels
**Learning:** `aria-label` attributes shouldn't be added to buttons that already have sufficiently descriptive visible text. It creates clutter and redundancy for screen reader users, who will just read the `aria-label` anyway.
**Action:** Only add `aria-label` to icon-only buttons or elements where the visible text is missing or non-descriptive.
