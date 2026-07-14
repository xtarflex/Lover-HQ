# 📍 Milestone: Chat Feature Refactor & Future Roadmap

This document outlines the accomplishments of the chat interface overhaul, current implemented state, and the remaining roadmap to transition the simulated features into fully production-ready components.

---

## 🟢 Phase 1: Overhauled Interface & Core Sync (Completed)

### 1. Layout & Viewport Spacing
- **Full Viewport Layout**: Disabled global `TopBar` and `BottomNav` layouts on the `/chat` route to maximize screen real estate on mobile devices.
- **Scroll & Padding Optimization**: Added generous bottom padding (`pb-24`) to the message scroll list container so that messages are never obscured by the bottom input panel or typing indicators.
- **Auto-Scroll Behavior**: Implemented smooth scroll-to-bottom on new messages and active typing indicators.

### 2. Custom Presence Header
- **Typing Indicator**: Real-time `typing...` state synced over Supabase channels.
- **Simplified Presence**: Shows standard `online` if the partner is in the chat room. If they are online and in another part of the app, it displays `online • Home`. If offline, computes relative last-seen (e.g., `Last seen 15m ago`) transitioning to full date/time formatting after 24 hours.

### 3. Telegram-Style Message Bubbles
- **Adaptive Padding**: Conditionally formats bubbles based on whether they contain text or only media (`isMediaOnly`). Media-only items (images, documents, locations) render in a clean, card-like format without speech bubble tails.
- **Embedded Meta Footer**: Renders timestamps, edited status, and read/unread check marks inside the bottom-right corner of text bubbles to prevent layout overlap.

### 4. Interactive Context Menu & Reactions
- **Long-Press/Double-Click Overlay**: Dimmed backdrop blur z-index optimized (overlay at z-index 40, active bubble at z-index 50).
- **Emoji Reactions Badge**: Re-integrated absolute-positioned reactions badge (`-bottom-2.5 right-3`) that overlays on the outer edge of the bubble without clipping.
- **Functional Pinning**: Clicking "Pin" updates local storage, mounts a sticky pinned message banner below the header, and broadcasts a `pin_message` event to sync the banner on the partner's screen. Clicking the banner scrolls the target message into view with a gold highlight pulse.

### 5. Media Uploads & Least-Size Compression
- **Client-Side WebP Compression**: Integrates HTML5 Canvas compression utility (`compressImage`) before upload. Automatically converts images to `.webp` format at `0.5` quality, keeping uploads under 50KB to minimize storage usage.
- **Bucket Storage**: Uploads WebP blob directly to Supabase storage bucket `fridge-media` with the correct `image/webp` content type header.

### 6. Consolidated Attachments Drawer (Bottom Sheet)
- **Compact Panel**: Limited max height to `70vh` with an internal scroll view to ensure usability on smaller viewports.
- **Layout Restructure**: Consolidated sections by removing empty placeholders. Renders Actions Grid (2x3 icons) at the top, and Link Fridge Items below it.
- **Visual Reference Previews**: Notes show left colored borders matching sticky note colors. Photo magnets render actual image thumbnails from their Supabase storage URLs so users can visually distinguish them.

---

## 🟡 Phase 2: From Stub to Real (Future Milestones)

The following stubs are scheduled for full implementation in upcoming sprints:

### 🏃 Milestone 2.1: Voice & Media (Estimate: 1.5 Days)
- **Wavesurfer Voice Playback**: Integrate `wavesurfer.js` to draw real-time audio wave previews for recorded voice memo blobs instead of using custom CSS static bars.
- **Native Camera Capture**: Integrate the HTML5 MediaDevices API to open front/back cameras in a mobile-optimized overlay, capturing snapshots directly inside the chat interface.

### 📊 Milestone 2.2: Documents & Polls (Estimate: 2.0 Days)
- **Document Uploader**: Implement a file picker supporting `.pdf`, `.docx`, and `.txt`. Calculate file size metadata and generate download links using Supabase Storage.
- **Interactive Polls**:
  - Add a "Create Poll" modal inside the bottom sheet.
  - Store question options inside a JSONB column on the message row.
  - Broadcast real-time vote updates via Supabase DB replication.

### 🗺️ Milestone 2.3: Location & Contacts (Estimate: 1.5 Days)
- **Location Picker Leaflet/Google Maps**: Embed a map iframe or Leaflet container inside a modal to allow dragging a pin and sending coordinate links.
- **Contacts Linker**: Access browser contacts API or render partner profiles list for fast contact sharing.

### 📞 Milestone 2.4: WebRTC Audio/Video Calling (Estimate: 4.0 Days)
- **Signaling Server**: Utilize Supabase Real-Time Broadcast channels to exchange WebRTC SDP offers, answers, and ICE candidates.
- **P2P Audio/Video Streams**: Establish local camera/microphone media stream connections and render a full-screen overlay for active audio or video calling.
