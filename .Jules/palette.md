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
## 2024-09-18 - Responsive Text Labels and ARIA
**Learning:** When using responsive utility classes (like Tailwind's `hidden sm:inline`) to hide button text on smaller screens, the buttons lose their accessible names for screen reader users on mobile devices if they solely rely on the text content.
**Action:** Always provide explicit `aria-label` attributes on buttons where the visible text label might be hidden at certain breakpoints.

## 2026-09-17 - aria-labels for Chat interactive buttons
**Learning:** Several icon-only buttons in the Chat feature components (like `EmojiStickerDrawer` and `MediaPreviewSheet`) lacked `aria-label` attributes, though some had `title` attributes. Relying solely on `title` is insufficient for robust screen reader support.
**Action:** When creating or modifying icon-only functional buttons across the application, ensure they always have an explicit, descriptive `aria-label` to guarantee full accessibility, regardless of whether a `title` tooltip is also present.

## 2026-09-19 - Accessible Custom Dropdowns
**Learning:** Custom dropdown menus built with generic elements need explicit ARIA roles (like listbox, option, combobox) and states (like aria-expanded, aria-selected) to be fully understandable and navigable by screen readers.
**Action:** Always verify that custom dropdown triggers use aria-haspopup and aria-expanded, and their options are wrapped in a listbox role with proper aria-selected states.

## 2026-09-20 - aria-labels for emoji reaction buttons
**Learning:** Icon-only buttons used for emojis (like reaction trays) are ambiguous to screen readers if they lack descriptive accessible names, even if the emoji itself has intrinsic meaning.
**Action:** When creating reaction buttons or similar emoji-based icon-only controls, always provide an explicit `aria-label` (e.g., `aria-label={"React with ${emoji}"}`). Update dynamically if the state changes.

## 2026-09-21 - aria-labels for Chat input fields
**Learning:** The Chat feature's input fields (like the emoji search, media caption, and voice note slider) lack `aria-label` attributes or matching `id`s for labels, which makes them inaccessible to screen readers as they do not provide context.
**Action:** Ensure all inputs, especially those without visible text labels (like search bars, sliders, or inline form inputs), include an explicit `aria-label` attribute if they do not have a linked `<label>` element.
## 2026-09-24 - Added missing aria-labels to MagnetCommentDrawer emoji buttons
**Learning:** The emoji reaction buttons generated via mapping `ANIMATED_EMOJIS` in `MagnetCommentDrawer.jsx` lacked explicit `aria-label` attributes, making them inaccessible to screen readers despite having visual icons and `title` attributes.
**Action:** When creating mapped emoji buttons or interactive elements that rely primarily on icons/titles, always add explicit `aria-label` attributes. Use dynamic values based on interaction state (e.g., `hasReacted ? 'Remove ${emoji.label} reaction' : 'React with ${emoji.label}'`) to provide clear feedback to assistive technologies.
