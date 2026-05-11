# 🏠 Lover-HQ

A private digital space for long-distance couples, built with love and React.

## 🎯 Project Overview

Lover-HQ is a mobile-first Progressive Web App (PWA) designed for two people in a long-distance relationship. It's not a messaging app—it's a **private digital house** with rooms for different types of connection:

- **🎨 The Fridge**: A shared canvas for notes, photos, and voice messages
- **🎵 Music Room**: Synchronized listening experience with shared queue
- **🎲 Games**: Turn-based games (Three Men's Morris)
- **🔓 Reveal**: Daily blind Q&A that unlocks when both answer
- **📍 The Board**: Collaborative bucket list for future plans
- **👤 Profile**: Partner-centric profile with mood tracker and countdown

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Hosting**: Netlify
- **PWA**: Service Worker with offline support

## 📁 Project Structure

```
/src
  /assets              # Static files
  /components          # Shared UI components
  /contexts            # Global state management
  /features            # Feature modules (lazy-loaded)
    /auth              # Onboarding & pairing
    /fridge            # Shared canvas
    /music             # Music player
    /games             # Mini-games
    /reveal            # Daily Q&A
    /board             # Bucket list
    /profile           # Partner profile
  /hooks               # Custom React hooks
  /lib                 # Utilities & Supabase client
  /types               # JSDoc type definitions
  App.jsx              # Main app with routing
  main.jsx             # Entry point
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier)
- Netlify account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd lover-hq
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Set up Supabase database**
   
   Run the SQL migrations in `/supabase/migrations/` in your Supabase SQL editor:
   - `001_create_users_table.sql`
   - `002_create_fridge_items_table.sql`
   - `003_create_music_queue_table.sql`
   - `004_create_reveals_table.sql`
   - `005_create_board_items_table.sql`
   - `006_create_game_sessions_table.sql`
   - `007_enable_rls_policies.sql`

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open http://localhost:5173 in your browser.

## 🔐 Authentication Flow

### Pairing Process

1. **User A** sets up their profile and generates a 6-digit pairing code
2. **User B** enters the code to link accounts
3. Both users are now paired and can access shared features

### Important Notes

- Each user sets their own name and avatar during setup
- The **Profile tab** displays your partner's details (not your own)
- You can edit your partner's name/avatar, but not your own
- This creates a partner-centric experience

## 🎨 Design System

### Colors (Dark Theme)

```css
Background: #0F172A (Deep Slate)
Surface:    #1E293B (Charcoal)
Primary:    #F59E0B (Warm Gold)
Text:       #F8FAFC (Off-white)
Border:     #334155 (Medium Slate)
```

### Typography

- **Headers**: Nunito (rounded, friendly)
- **Body**: Inter (clean, readable)
- **Handwritten notes**: Caveat (personal touch)

### Voice & Tone

- Warm, not corporate: "A note is waiting" vs "New message received"
- Partner-centric: "They're here" vs "User 2 is online"
- Asynchronous-friendly: No urgency pressure

## 📱 PWA Features

- **Installable**: Add to home screen on mobile
- **Offline support**: Cached fridge view when offline
- **Push notifications**: For games, daily prompts, presence alerts
- **Fast loading**: < 2s initial load, lazy-loaded features

## 🧪 Development Workflow

### Using Jules (AI Coding Agent)

This project uses Jules for automated code generation via Pull Requests:

1. **Connect repo to Netlify** for preview deployments
2. **Create feature branch** for each PR
3. **Use Jules prompts** from ROADMAP.md for each phase
4. **Review preview URL** on Netlify
5. **Merge to main** when approved

### Code Quality

- **Linting**: ESLint with React + Hooks rules
- **Formatting**: Prettier (run `npm run format`)
- **Type safety**: JSDoc annotations
- **Testing**: Manual testing on mobile devices

## 🚢 Deployment

### Netlify Configuration

1. Connect GitHub repo to Netlify
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Environment variables: Add Supabase credentials
4. Deploy settings: Auto-deploy on push to `main`

### Supabase Configuration

1. Database: PostgreSQL with Row Level Security
2. Storage: For user avatars, fridge photos, audio uploads
3. Realtime: For presence tracking and live sync
4. Auth: Anonymous sessions (no email required)

## 📊 Monitoring

### Performance

- Monitor Netlify analytics for page load times
- Track Supabase realtime connection stability
- Measure media upload success rates

### Errors

- Client-side errors logged to Supabase Edge Functions
- Error boundaries catch and display failures gracefully

## 🔒 Security

### Row Level Security (RLS)

All Supabase tables have RLS policies ensuring:
- Users can only access their own data and their partner's data
- Profile edits are restricted to partner's data only
- No user can access data from other couples

### Content Validation

- Image uploads: Max 1MB, validated MIME types
- Voice notes: Max 5MB, audio/* only
- XSS protection: All user content sanitized

## 🤝 Contributing

This is a private project for two users, but if you're building something similar:

1. Fork the repository
2. Check out ARCHITECTURE.md for technical details
3. Review CODE_SNIPPETS.md for patterns
4. Follow the ROADMAP.md for feature development

## 📄 License

Private project - All rights reserved

## 💖 Built With Love

Created for maintaining intimacy across distance. May your connection stay strong! 🏠✨

---

## 📚 Additional Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture details
- [BRANDING.md](./BRANDING.md) - Design system and brand guidelines
- [ROADMAP.md](./ROADMAP.md) - Development phases and milestones
- [CODE_SNIPPETS.md](./CODE_SNIPPETS.md) - Reusable patterns and snippets
