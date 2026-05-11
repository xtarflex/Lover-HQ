# Lover-HQ Agent Context & Knowledge

This file contains the core knowledge, rules, and context for the Lover-HQ project. AI agents working on this repository must read and adhere to these guidelines.

## 1. Core Concept & App Architecture

*   **Project Vision:** Lover-HQ is a "private digital house" designed to maintain intimacy in a long-distance relationship. It's a specialized software solution meant to solve communication fatigue and asynchronous schedules, moving away from standard texting apps.
*   **Platform:** Mobile-first Progressive Web App (PWA) designed to feel like a native app. Built with React + Vite + Supabase.
*   **Target Audience:** Strictly for two users (the creator and their girlfriend).
*   **App Shell Structure:**
    *   **Top Bar:** Minimalist Logo (Left), Dynamic Status Indicator (Center, showing partner's activity or synced track), Partner's Avatar (Right, glowing when online).
    *   **Main Content:** Dynamic space for rendering the active feature. Defaults to "The Fridge".
    *   **Bottom Navigation:** Minimalist strip displaying the active room label, with an elevated, circular center "Home" button that opens a dashboard grid.
*   **The Profile Logic:** Crucial concept. The app is partner-centric. Initial setup configures your own details, which are locked (or 24h grace period). The persistent "Profile" tab inside the app focuses *entirely* on viewing and interacting with the *partner's* details (e.g., mood tracker, their countdowns).

## 2. Branding & UI Specifications

*   **Themes:**
    *   **Default Theme (Dark):** Deep Slate/Charcoal background (`#0F172A`, `#1E293B`), Warm Gold primary accent (`#F59E0B`), Off-white text (`#F8FAFC`).
    *   **Future Theme (Light):** White/Off-white background (`#FFFFFF`, `#F1F5F9`), Soft Pink/Red primary accent (`#EC4899`), Dark text (`#0F172A`).
*   **Typography:**
    *   **Headings:** Quicksand / Nunito (friendly, rounded).
    *   **Body:** Inter / Roboto (clean, readable).
    *   **Messages:** Caveat / Kalam (handwriting fonts for personal touch).
*   **Logo & Icons:** Minimalist house outline with a subtle heart shape. Lucide React icons.
*   **Tone:** Warm, asynchronous-focused (e.g., "A note was left" instead of "Message Sent").

## 3. Strict Technical Rules & Architecture Requirements

Agents must adhere to these rules to ensure production-grade code:

*   **State Management:** Use Context API + `useReducer` for global state (e.g., `AppContext.jsx`). **DO NOT use prop drilling.**
*   **Supabase Client:** Implement a **Singleton Pattern** for the Supabase API client (`src/lib/supabase.js`) to prevent multiple WebSocket connections and quota exhaustion.
*   **Real-time Subscriptions:** Custom hooks (e.g., `useRealtimeSubscription`) MUST be used for Supabase real-time channels, and they **MUST include proper cleanup functions** on unmount to prevent memory leaks.
*   **Security (RLS):** Database security relies on Row Level Security (RLS). Users can only read their own and their partner's data. Users can only update their partner's profile.
*   **Type Safety:** Use JSDoc type definitions for all data structures (e.g., User, FridgeItem) to ensure type safety.
*   **Resilience:** Wrap the app in an Error Boundary component to prevent total crashes.
*   **Environment Variables:** Validate required environment variables (like Supabase URLs/keys) at startup using custom validation logic. Do not hardcode secrets.
*   **Performance:**
    *   Implement lazy loading for route components (`src/features/`) using `Suspense` and `react-router-dom`.
    *   Implement proper loading states (e.g., `useAsyncData` hook) to prevent flashing empty content.
*   **PWA Setup:** Use `vite-plugin-pwa` for service worker configuration (e.g., caching media and offline fallbacks).
*   **Styling:** Use Tailwind CSS configured with design tokens (from branding specs). Strictly avoid magic strings.
*   **Linting:** Adhere to standard recommended strict rules for ESLint and Prettier for React + Hooks.

## 4. Feature Specifications (The Rooms)

1.  **The Fridge (Default View):** A shared canvas for handwriting-style notes, photos (max 1MB), and voice snippets (max 5MB). Drag-and-drop requires a "long-press to edit" mode for mobile. Uses Supabase real-time broadcast for dragging if both are online.
2.  **The Listening Room:** A custom audio player. Syncs exactly for uploaded audio files using Supabase broadcast. External links (YouTube) offer optional sync or just "shared awareness" of what the partner is listening to.
3.  **The Arcade (Games):** Turn-based games like Three Men's Morris. State stored in Supabase. Push notifications indicate when it's the user's turn.
4.  **The Blind Reveal:** A daily Q&A where answers are blurred until both partners answer. Uses Supabase RLS to hide answers until conditions are met. Starts with a static JSON bank of prompts.
5.  **The Board (Someday List):** A categorized bucket list. Can vote with hearts. Items can be marked as complete, prompting for a photo or memory to create a scrapbook effect.
6.  **Onboarding/Pairing:** User sets up their own profile, generates a 6-digit pairing code (or invite link), and sends it to their partner. Partner inputs the code to sync accounts.

## 5. Development Phases

*   **Phase 1:** Foundation (App shell, Supabase singleton, Context, Error Boundaries).
*   **Phase 2:** Onboarding & Pairing.
*   **Phase 3:** Presence indicator & Top Bar logic.
*   **Phase 4:** The Fridge.
*   **Phase 5:** Reveal (Blind Q&A).
*   **Phase 6:** Games.
*   **Phase 7:** Music Room.
*   **Phase 8:** The Board.
