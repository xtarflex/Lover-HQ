## 2024-07-08 - Accessible Custom Toggles
**Learning:** Custom UI toggle switches (often implemented as `<button>` elements with Tailwind CSS like `h-6 w-11 rounded-full`) lack inherent semantic meaning for screen readers. They need explicit ARIA roles and states.
**Action:** When creating or modifying custom toggle switches, always ensure they have `role="switch"`, an accurate `aria-checked` boolean state, and a descriptive `aria-label` to provide proper context and feedback to assistive technologies.
