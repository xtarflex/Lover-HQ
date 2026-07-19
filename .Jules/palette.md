## 2024-07-08 - Accessible Custom Toggles
**Learning:** Custom UI toggle switches (often implemented as `<button>` elements with Tailwind CSS like `h-6 w-11 rounded-full`) lack inherent semantic meaning for screen readers. They need explicit ARIA roles and states.
**Action:** When creating or modifying custom toggle switches, always ensure they have `role="switch"`, an accurate `aria-checked` boolean state, and a descriptive `aria-label` to provide proper context and feedback to assistive technologies.
## 2024-05-18 - Avoid redundant aria-labels
**Learning:** `aria-label` attributes shouldn't be added to buttons that already have sufficiently descriptive visible text. It creates clutter and redundancy for screen reader users, who will just read the `aria-label` anyway.
**Action:** Only add `aria-label` to icon-only buttons or elements where the visible text is missing or non-descriptive.

## 2024-07-09 - Added missing aria-labels to interactive buttons
**Learning:** Some small inline functional buttons (like emoji reaction buttons in Chat or "Copy/Share" controls inside PairingSetup) lacked `aria-label`s, rendering them ambiguous for screen readers since they rely heavily on icons or shorthand text.
**Action:** Always verify that interactive buttons relying heavily on icons, or context-dependent shorthand text (e.g., "Cancel", "Save"), include explicit descriptive `aria-label` attributes.
## 2024-07-19 - Form Input Accessibility
**Learning:** React form inputs must have `id` attributes that match the `htmlFor` of their corresponding `<label>` to be accessible to screen readers, allowing users to click the label text to focus the input field.
**Action:** When adding or modifying `<label>` and `<input>` elements, always pair them explicitly using `htmlFor` and `id` attributes.

## 2024-07-22 - aria-labels for Fridge icon buttons
**Learning:** Several icon-only buttons in the Fridge feature components (like FridgeItem, NoteModal, PhotoModal, and VoiceModal) lacked `aria-label` attributes, though some had `title` attributes. Relying solely on `title` is insufficient for robust screen reader support.
**Action:** When creating or modifying icon-only functional buttons, ensure they always have an explicit, descriptive `aria-label` to guarantee full accessibility, regardless of whether a `title` tooltip is also present.
