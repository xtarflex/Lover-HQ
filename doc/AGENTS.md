# 🤖 Lover-HQ Agent Guidelines & Guardrails

This document defines style guidelines, behavioral constraints, testing workflows, and instructions that AI agents working on this codebase must follow.

---

## 1. Code Verification & Quality Gates

Before staging, committing, or pushing code to GitHub, the agent must ALWAYS run local validation checks using the repository's package manager (**pnpm**):

1. **Linting**: Run `pnpm lint` to ensure there are no ESLint errors.
2. **Tests**: Run `pnpm test:run` to ensure all 400+ Vitest unit tests pass.
3. **Build Check**: Run `pnpm build` to verify the production bundle builds without errors before opening PRs.
4. **No Broken Code**: If any local check fails, the agent must resolve the lint errors or test failures before committing or pushing code.

---

## 2. GitHub PR Merge & CI/CD Behavior

- **Verify CI/CD Status**: When merging a Pull Request (PR) on GitHub, the agent must ALWAYS wait for all CI/CD status checks to complete: `gh pr checks --watch --fail-fast`.
- **No Early Merges**: Verify that all checks have successfully passed (`pass` status) before executing `gh pr merge`.
- **Handle Failures**: If a check fails, inspect the logs, resolve the underlying errors on the source branch, push the fixes, and re-verify before attempting to merge.

---

## 3. Deployment & Commit Message Restrictions

- **No Unauthorized Deploys**: Never append `[release]`, `[feature release]`, `[deploy]`, or `[major]` tags to any commit message. You are strictly forbidden from triggering a production build unless the `deploy-trigger` skill has been explicitly activated by the user.

---

## 4. Professional Code Abstraction & Naming Rules

Enforce professional code abstraction at all times across UI components, files, CSS classes, and JavaScript identifiers:
- **Detach Names from Prompts**: Never copy the user's prompt phrasing, conversational slang, or typos into variable names, CSS classes, or function identifiers.
- **User-Facing UI Copy**: Apply the same abstraction to user-facing text. Never place raw prompt instructions or technical plumbing jargon directly onto the UI. Translate them into warm, polished, partner-centric, or professional application copy.
- **Standardize Terminology**: Translate raw user intent into clean, industry-standard technical terms (e.g. "button to hide the popup" -> `dismissOverlay` or `toggleModal`).
- **Contextual Naming**: Name variables based on their **function** and **data type**, following existing conventions (`is[Action]`, `handle[Event]`, `[Entity]Controller`).
- **Avoid Literalism**: Do not treat the description of a problem as the name of the solution (e.g. do not name a bug-fix function `fixPlayLoopBug()`).
- **Human-Centric Copy (No Mechanism-First Jargon)**: Never describe internal hardware actuators, backend plumbing, or sensory mechanics (e.g., "vibrates", "nudges", "cloud-sync engine", "fetching data") in user-facing text. Always translate the technical mechanism into the human benefit (e.g., replace *"Answer questions and watch as your partner gets real-time nudges and vibrations to answer"* with *"Answer fun questions together and see your partner's responses instantly"*).

---

## 5. Browser Permission Request Guidelines

When requesting browser-level permissions (e.g. Geolocation, Notifications, Microphone, Camera):
- **Diagnostic Catch Blocks**: Always catch permission rejection errors (like `NotAllowedError` or `PermissionDeniedError`) specifically.
- **Actionable Advice**: Provide clear instructions guiding the user to the address bar (such as the 🔒 lock icon) to manually reset permissions, since browsers block automatic re-prompting once denied.
- **Friendly Fallbacks**: Advise the user on alternative steps or device checks if the hardware is missing (e.g. `NotFoundError` or `DevicesNotFoundError`).

---

## 6. Architecture & Concurrency Rules

- **Feature Branch Development**: Always perform new development work on a dedicated feature branch. Do not commit or work directly on the `main` branch.
- **Context Isolation**: Keep high-frequency audio playback in `MusicContext` and general session state in `AppContext`. Always wrap context values in `useMemo`.
- **Channel Decoupling**: Do not bind Supabase Realtime channel subscriptions to transient UI re-render states or room routes. Read dynamic values via `useRef` handles inside message listeners.
- **Atomic Offline Queues**: Use concurrency locks (`isSyncingRef`) and atomic set reconciliation in offline storage queues to guarantee zero data loss.
- **Singleton Pattern**: Always import the Supabase client from `src/lib/supabase.js`. Never call `createClient` inside components.
