# 📍 Milestone: Chat Feature Refactor & Future Roadmap

This document outlines the accomplishments of the chat interface overhaul, current implemented state, and the remaining roadmap to transition the simulated features into fully production-ready components.

---

## 🟢 Phase 1: Overhauled Interface & Core Sync (Completed)

### 1. Layout & Viewport Spacing
- **Full Viewport Layout**: Disabled global `TopBar` and `BottomNav` layouts on the `/chat` route to maximize screen real estate on mobile devices.
- **Scroll & Padding Optimization**: Added bottom padding (`pb-24`) to the message scroll list container so that messages are never obscured by the bottom input panel or typing indicators.
- **Auto-Scroll Behavior**: Implemented smooth scroll-to-bottom on new messages and active typing indicators.

### 2. Custom Presence Header
- **Typing Indicator**: Real-time `typing...` state synced over Supabase channels.
- **Simplified Presence**: Shows standard `online` if the partner is in the chat room. If they are online and in another part of the app, it displays `online • Home`. If offline, computes relative last-seen (e.g., `Last seen 15m ago`) transitioning to full date/time formatting after 24 hours.

### 3. Telegram-Style Message Bubbles & Media Albums
- **Adaptive Padding**: Conditionally formats bubbles based on text vs. media-only content.
- **Embedded Meta Footer**: Renders timestamps, edited status, and read/unread check marks inside the bottom-right corner of text bubbles to prevent layout overlap.
- **Batch Media Albums**: Couples batch-sent media (images/videos) into Telegram-style grid layouts with a maximum layout threshold.

### 4. Interactive Context Menu, Reactions & Pinning
- **Long-Press Overlay**: Blur z-index optimized (overlay at z-index 40, active bubble at z-index 50).
- **Emoji Reactions Badge**: Re-integrated reactions badge overlaying on the outer edge of the bubble without clipping.
- **Functional Pinning**: Clicking "Pin" updates local storage, mounts a sticky pinned message banner below the header, and broadcasts `pin_message` to sync the partner's screen.

### 5. Media Uploads & Least-Size Compression
- **Client-Side WebP Compression**: Integrates canvas-based WebP conversion (`0.5` quality) keeping uploads under 50KB.
- **Supabase Bucket Integration**: Uploads blobs directly to the Supabase `chat-media` storage bucket.

### 6. Consolidate Attachments Bottom Sheet
- **Height Restructuring**: Limited sheet to `70vh` max height with an internal scroll view.
- **Section Layout**: Consolidates Action Grid items and lists Link Sticky Notes/Photo Magnets with live visual thumbnails.

### 7. In-App Image & Video Editing Flow
- **Telegram-Style Workspace**: Implemented a pure black, borderless staging canvas (`bg-black` and `overflow-visible` container) preventing rotated landscape image clipping.
- **Interactive Cropping**: Added a resizable crop bounding box with an inner 3x3 reference grid (Rule of Thirds) and multi-touch corners to slice/bake image bounds.
- **Live Filter Presets**: Added filter presets animated smoothly with `framer-motion`'s `AnimatePresence` and horizontal fade masks.
- **Native Video Support**: Fully supports video staging previews, inline video playback inside chat bubbles, and lightbox video controls.

### 8. High-Fidelity Voice Recording
- **Symmetric Waveforms**: Captured microphone sound levels and mapped them to a dynamic visualizer that propagates symmetrically outward from the center.
- **Pause/Resume/Trash**: Fully implemented recording pause/resume state management and visual preview before sending.
- **Play-back Seek Fix**: Spaced playback waveform bars using `justify-between` to ensure dragging or clicking anywhere along the container aligns perfectly with track duration.

### 9. Browser Permission Guardrails
- **Diagnostic Error Catching**: Explicitly catches permission rejection errors (like `NotAllowedError` or `PermissionDeniedError`) and hardware failures (`NotFoundError`).
- **Actionable Reset Help**: Automatically prompts the user with customized step-by-step instructions to reset access via the address bar's 🔒 lock icon.

---

## 🟡 Phase 2: From Stub to Real (Future Milestones)

The following stubs are scheduled for full implementation in upcoming sprints:

### 📊 Milestone 2.1: Documents & Polls (Estimate: 2.0 Days)
- **Document Uploader**: Implement a file picker supporting `.pdf`, `.docx`, and `.txt`. Calculate file size metadata and generate download links using Supabase Storage.
- **Interactive Polls**:
  - Add a "Create Poll" modal inside the bottom sheet.
  - Store question options inside a JSONB column on the message row.
  - Broadcast real-time vote updates via Supabase DB replication.

### 🗺️ Milestone 2.2: Location & Contacts (Estimate: 1.5 Days)
- **Location Picker Leaflet/Google Maps**: Embed a map iframe or Leaflet container inside a modal to allow dragging a pin and sending coordinate links.
- **Contacts Linker**: Access browser contacts API or render partner profiles list for fast contact sharing.

### 📞 Milestone 2.3: WebRTC Audio/Video Calling (Estimate: 4.0 Days)
- **Signaling Server**: Utilize Supabase Real-Time Broadcast channels to exchange WebRTC SDP offers, answers, and ICE candidates.
- **P2P Audio/Video Streams**: Establish local camera/microphone media stream connections and render a full-screen overlay for active audio or video calling.
