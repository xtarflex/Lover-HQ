# 🗺️ Lover-HQ Development Roadmap

## Phase 0: Foundation (Week 1)

### Goals
- Set up production-ready project infrastructure
- Establish development workflow (Git → Jules → Netlify)
- Configure Supabase project

### Deliverables
- [ ] Vite + React project initialized
- [ ] Tailwind CSS configured with design tokens
- [ ] Supabase project created with database schema
- [ ] Error boundary implemented
- [ ] Global state management (Context + Reducer)
- [ ] Custom hooks for real-time subscriptions
- [ ] ESLint + Prettier configured
- [ ] Netlify deployment pipeline active

### Jules PR Sequence
1. **PR #0.1**: Initialize Vite project with dependencies
2. **PR #0.2**: Configure Tailwind with custom design tokens
3. **PR #0.3**: Set up Supabase singleton client
4. **PR #0.4**: Implement AppContext with reducer
5. **PR #0.5**: Create reusable hooks (useRealtimeSubscription, useAsyncData)
6. **PR #0.6**: Build Error Boundary component
7. **PR #0.7**: Configure ESLint/Prettier strict rules
8. **PR #0.8**: Set up PWA configuration (manifest + service worker)

---

## Phase 1: Authentication & Pairing (Week 2)

### Goals
- Build complete onboarding flow
- Implement pairing system (6-digit code)
- Set up user profiles in database

### Deliverables
- [ ] Onboarding UI (name, avatar upload/selection)
- [ ] Pairing code generation and validation
- [ ] Database triggers for partner linking
- [ ] Auth session management
- [ ] Initial app shell (TopBar, BottomNav)

### Jules PR Sequence
1. **PR #1.1**: Create Onboarding component with form validation
2. **PR #1.2**: Implement avatar upload to Supabase Storage (1MB limit)
3. **PR #1.3**: Build pre-made avatar picker (emoji-based)
4. **PR #1.4**: Create pairing code generation logic
5. **PR #1.5**: Implement code validation and partner linking
6. **PR #1.6**: Build TopBar with logo and avatar slot
7. **PR #1.7**: Build BottomNav with elevated Home button
8. **PR #1.8**: Add route protection (redirect to onboarding if unpaired)

### Testing Checklist
- [ ] User A generates code successfully
- [ ] User B can enter code and pair
- [ ] Both users see each other as partners
- [ ] Invalid codes show error message
- [ ] Avatar upload respects 1MB limit
- [ ] Session persists after browser restart

---

## Phase 2: Presence System (Week 3)

### Goals
- Real-time online/offline indicators
- Dynamic TopBar breadcrumb
- Current room tracking

### Deliverables
- [ ] Presence channel subscription
- [ ] Avatar glow effect (online = gold, offline = grayscale)
- [ ] TopBar center text updates based on partner activity
- [ ] Room navigation tracking

### Jules PR Sequence
1. **PR #2.1**: Create usePresence hook with Supabase Presence API
2. **PR #2.2**: Implement Avatar component with online/offline styles
3. **PR #2.3**: Build dynamic TopBar breadcrumb logic
4. **PR #2.4**: Add presence tracking to App.jsx (broadcasts on route change)
5. **PR #2.5**: Create LoadingSpinner component for async states
6. **PR #2.6**: Add connection status indicator (lost connection warning)

### Testing Checklist
- [ ] Opening app in second browser shows user as online
- [ ] Avatar changes from grayscale to gold when partner connects
- [ ] TopBar shows "They're in the Music Room" when partner navigates
- [ ] Closing tab/browser updates presence to offline
- [ ] Network disconnect shows warning banner

---

## Phase 3: The Fridge (Week 4-5)

### Goals
- Persistent canvas with draggable items
- Real-time sync for notes, photos, voice
- Optimistic UI updates

### Deliverables
- [ ] Fridge canvas component
- [ ] Sticky note creation with handwriting font
- [ ] Image upload (magnets)
- [ ] Voice note recording and playback
- [ ] Real-time drag-and-drop sync
- [ ] Long-press to edit mode (mobile)

### Jules PR Sequence
1. **PR #3.1**: Create Fridge component with absolute-positioned items
2. **PR #3.2**: Implement FridgeItem component (note/photo/voice variants)
3. **PR #3.3**: Build sticky note editor with Caveat font
4. **PR #3.4**: Add image upload with 1MB validation
5. **PR #3.5**: Implement voice recording (MediaRecorder API, 5MB limit)
6. **PR #3.6**: Create useFridgeDrag hook with touch/mouse events
7. **PR #3.7**: Add Supabase Broadcast for real-time drag sync
8. **PR #3.8**: Implement optimistic UI (local update → server sync → rollback on error)
9. **PR #3.9**: Add long-press gesture for edit mode (prevent scroll conflict)
10. **PR #3.10**: Create waveform preview for voice notes (wavesurfer.js)

### Testing Checklist
- [ ] Can create sticky note and see it persist
- [ ] Dragging note in browser A moves it in browser B (real-time)
- [ ] Image upload compresses to < 1MB
- [ ] Voice recording stops at 5MB limit
- [ ] Long-press enters edit mode on mobile
- [ ] Items load in correct X/Y positions after refresh

---

## Phase 4: Reveal (Blind Q&A) (Week 6)

### Goals
- Daily question system
- Blur/reveal logic
- Archive ("Memory Lane")

### Deliverables
- [ ] Daily prompt rotation (JSON bank)
- [ ] Answer submission form
- [ ] Blur effect until both answered
- [ ] Archive view with past questions
- [ ] Nudge notification

### Jules PR Sequence
1. **PR #4.1**: Create prompts.json with 100+ questions
2. **PR #4.2**: Build DailyQuestion component with blur overlay
3. **PR #4.3**: Implement answer submission logic
4. **PR #4.4**: Add reveal trigger (when both answers submitted)
5. **PR #4.5**: Create Archive component with scrollable list
6. **PR #4.6**: Build nudge button (sends push notification)
7. **PR #4.7**: Add daily prompt rotation logic (day_of_year % prompts.length)

### Testing Checklist
- [ ] New question appears at midnight (local time)
- [ ] Partner's answer is blurred until user submits
- [ ] Answers reveal simultaneously after both submit
- [ ] Archive shows all past Q&As chronologically
- [ ] Nudge sends push notification (if permissions granted)

---

## Phase 5: Games (Three Men's Morris) (Week 7)

### Goals
- Turn-based game with real-time state sync
- Win/loss tracking
- Turn notifications

### Deliverables
- [ ] Game board UI
- [ ] Placement phase logic
- [ ] Movement phase logic
- [ ] Win condition detection
- [ ] Scorecard
- [ ] Turn notification

### Jules PR Sequence
1. **PR #5.1**: Create ThreeMensMorris component with 3x3 grid
2. **PR #5.2**: Implement placement phase logic (6 pieces each)
3. **PR #5.3**: Add movement phase logic (adjacent squares only)
4. **PR #5.4**: Build win detection (3 in a row)
5. **PR #5.5**: Create useGameState hook with Supabase sync
6. **PR #5.6**: Add turn indicator UI
7. **PR #5.7**: Implement scorecard (total wins/losses)
8. **PR #5.8**: Add push notification for "Your turn"

### Testing Checklist
- [ ] Players can place pieces alternately
- [ ] Can only move own pieces (correct turn enforcement)
- [ ] Win condition triggers correctly (3 in a row)
- [ ] Game state syncs between browsers
- [ ] Notification fires when it's partner's turn
- [ ] Scorecard updates after each game

---

## Phase 6: Music Room (Week 8-9)

### Goals
- Custom audio player for uploads
- Shared queue management
- Real-time play/pause/seek sync

### Deliverables
- [ ] Audio file upload (Supabase Storage)
- [ ] Queue UI (add/remove tracks)
- [ ] Playback controls
- [ ] Real-time sync for uploaded tracks
- [ ] External link support (YouTube embed)
- [ ] Visualizer (waveform or spinning record)

### Jules PR Sequence
1. **PR #6.1**: Create MusicPlayer component with HTML5 audio
2. **PR #6.2**: Implement audio file upload (10MB limit)
3. **PR #6.3**: Build Queue component (add/remove/reorder)
4. **PR #6.4**: Add useMusicSync hook (broadcast play/pause/seek)
5. **PR #6.5**: Implement sync for uploaded tracks (timestamp broadcast every 500ms)
6. **PR #6.6**: Add YouTube embed support (IFrame API)
7. **PR #6.7**: Create optional sync toggle for external links
8. **PR #6.8**: Build visualizer (canvas API waveform)
9. **PR #6.9**: Add "DJ Control" indicator (who started track)

### Testing Checklist
- [ ] Can upload audio and add to queue
- [ ] Play button starts playback on both devices (uploaded tracks)
- [ ] Pause syncs in real-time
- [ ] Seek bar drags sync timestamp
- [ ] YouTube links play (with optional sync)
- [ ] Visualizer animates during playback

---

## Phase 7: The Board (Bucket List) (Week 10)

### Goals
- Collaborative planning list
- Heart voting system
- Completion tracking

### Deliverables
- [ ] Board item creation form
- [ ] Category filters (Travel, Movies, Food, Life Goals)
- [ ] Heart button (both users can vote)
- [ ] Link preview for external URLs
- [ ] "Mark Complete" with photo upload

### Jules PR Sequence
1. **PR #7.1**: Create BucketList component with category tabs
2. **PR #7.2**: Build BoardItem component (title, link, hearts)
3. **PR #7.3**: Implement heart voting (toggle on/off)
4. **PR #7.4**: Add link preview using unfurl API
5. **PR #7.5**: Create "Mark Complete" flow (upload photo + memory note)
6. **PR #7.6**: Add filter/sort (by category, most-hearted)

### Testing Checklist
- [ ] Can create item in each category
- [ ] Heart button increments count
- [ ] Link preview shows thumbnail and title
- [ ] Marking complete prompts for photo
- [ ] Completed items move to archive

---

## Phase 8: Profile & Extras (Week 11)

### Goals
- Partner profile editing
- Mood tracker
- Countdown timer

### Deliverables
- [ ] Partner profile view (editable name/avatar)
- [ ] Local time clock widget
- [ ] Mood selector (5-7 emoji options)
- [ ] Countdown to next meetup

### Jules PR Sequence
1. **PR #8.1**: Create PartnerProfile component
2. **PR #8.2**: Add editable name/avatar fields (partner only)
3. **PR #8.3**: Build local time clock (analog design)
4. **PR #8.4**: Create MoodTracker with emoji picker
5. **PR #8.5**: Implement Countdown component (editable date)
6. **PR #8.6**: Add "days since last together" counter

### Testing Checklist
- [ ] Can edit partner's name (not own)
- [ ] Mood emoji shows on dashboard
- [ ] Countdown updates daily
- [ ] Local time shows partner's timezone

---

## Phase 9: Polish & PWA (Week 12)

### Goals
- Final UI refinements
- PWA installation flow
- Offline mode
- Performance audit

### Deliverables
- [ ] Install prompt for mobile
- [ ] Offline fallback screens
- [ ] Loading skeletons
- [ ] Animation polish
- [ ] Accessibility audit
- [ ] Performance optimizations

### Jules PR Sequence
1. **PR #9.1**: Add PWA install prompt
2. **PR #9.2**: Create offline indicator and cached fridge view
3. **PR #9.3**: Build loading skeletons for all async components
4. **PR #9.4**: Add animation polish (presence glow, page transitions)
5. **PR #9.5**: Audit accessibility (contrast, focus states, ARIA labels)
6. **PR #9.6**: Optimize bundle size (code splitting, tree shaking)
7. **PR #9.7**: Add "prefers-reduced-motion" respect
8. **PR #9.8**: Final QA and bug fixes

### Testing Checklist
- [ ] App prompts to install on home screen
- [ ] Works offline (shows cached fridge)
- [ ] All touch targets are 44px minimum
- [ ] Animations respect reduced-motion preference
- [ ] Lighthouse score: 90+ on all metrics

---

## Future Enhancements (Post-Launch)

### Light Theme
- [ ] Implement theme toggle
- [ ] Sync theme preference between users
- [ ] Update all components with light mode styles

### Additional Games
- [ ] Tic-Tac-Toe (Ultimate variant)
- [ ] Word chain game
- [ ] Exquisite Corpse drawing

### Advanced Music Features
- [ ] Spotify API integration
- [ ] Playlist creation
- [ ] Listening history

### Custom Prompts
- [ ] User-submitted questions for Reveal
- [ ] Prompt voting system

### Notifications
- [ ] Daily Reveal reminder
- [ ] "They're online" ping
- [ ] Game turn alerts

---

## Success Metrics

### Technical
- [ ] Uptime > 99%
- [ ] Real-time latency < 500ms
- [ ] Page load < 2 seconds
- [ ] Zero critical bugs

### User Experience
- [ ] Both users complete onboarding successfully
- [ ] Daily active usage > 70%
- [ ] At least 3 features used per week
- [ ] Positive user feedback

### Development
- [ ] All PRs reviewed and merged within 24 hours
- [ ] Code coverage > 70%
- [ ] No console errors in production
- [ ] Documentation up-to-date
