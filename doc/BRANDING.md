# 🎨 Lover-HQ Branding Guidelines

## Color Palettes

### 1. Eternal Noir (Luxury & Intimacy)
This palette is designed for a premium, concierge-style experience. It feels exclusive, mature, and deeply romantic. It works best with high-contrast serif typography and plenty of whitespace.

| Role | Color Name | Hex Code | Visual Vibe |
| :--- | :--- | :--- | :--- |
| Primary | Deep Bordeaux | `#4A0E0E` | Rich, wine-colored passion. |
| Secondary | Champagne Gold | `#D4AF37` | Luxury and high-value accents. |
| Background | Obsidian Silk | `#121212` | Deep, immersive, and intimate. |
| Surface | Smoke Grey | `#2C2C2C` | Subtle depth for cards and inputs. |
| Text | Soft Parchment | `#F5F5DC` | Warm, readable, and elegant. |

### 2. Blushing Petal (Soft & Dreamy)
This is a classic, approachable romantic palette. It feels light, airy, and optimistic. 

| Role | Color Name | Hex Code | Visual Vibe |
| :--- | :--- | :--- | :--- |
| Primary | Dusty Rose | `#E29595` | Soft, nurturing, and empathetic. |
| Secondary | Sage Whisper | `#B5C99A` | Grounded, organic, and fresh. |
| Background | Morning Mist | `#F7F9FB` | Clean, bright, and hopeful. |
| Surface | Pure Alabaster | `#FFFFFF` | Crisp and professional. |
| Text | Charcoal Plum | `#3D348B` | A softer alternative to pure black. |

## Typography

### Font Families
- **Headers/Titles**: Playfair Display (High-contrast Serif) or Cinzel
- **Body/UI**: Inter (weights: 400, 500, 600)
- **Handwritten Notes (Strictly for P2P text input/messages, not for app UI text)**: Caveat (weight: 400)

### Font Sizes (Mobile-First)
```css
--text-xs: 0.75rem;    /* 12px - timestamps, labels */
--text-sm: 0.875rem;   /* 14px - secondary text */
--text-base: 1rem;     /* 16px - body text */
--text-lg: 1.125rem;   /* 18px - section headers */
--text-xl: 1.25rem;    /* 20px - page titles */
--text-2xl: 1.5rem;    /* 24px - hero text */
```

## Logo Specifications

### Design
- Minimalist house outline with subtle heart shape integrated into the roof
- Single-color SVG (adapts to theme)
- Aspect ratio: 1:1 (square)
- Minimum size: 32px × 32px
- Safe area: 10% padding on all sides

### Color Usage
- Dark theme: Gold (#F59E0B)
- Light theme: Pink (#EC4899)
- Monochrome version: Current text color

## Voice & Tone

### Principles
1. **Warm, not corporate**: "A note is waiting" vs "New message received"
2. **Partner-centric**: Always reference "they/them" for partner, never "User 2"
3. **Asynchronous-friendly**: Avoid urgency language ("when you have time" vs "now")
4. **Intimate**: Use casual, affectionate phrasing where appropriate

### Examples
❌ **Avoid**: "User has logged in"  
✅ **Use**: "They're here"

❌ **Avoid**: "Message sent successfully"  
✅ **Use**: "Left on the fridge"

❌ **Avoid**: "Complete daily task"  
✅ **Use**: "Today's question is ready"

## UI Components Style

### Buttons
- **Primary**: Gold/Pink background, dark text, rounded-lg (0.5rem)
- **Secondary**: Transparent, border, current theme color
- **Ghost**: No border, subtle hover state

### Cards & Layout
- **Minimal Card Usage**: Avoid wrapping entire pages or large sections in card containers. Place content directly on the background to maintain a clean, mobile-native aesthetic.
- **Glassmorphism**: Use glassmorphism (`bg-surface/10 backdrop-blur-md`) selectively for smaller interactive elements like headers, inputs, and buttons, rather than for large wrapper cards.

### Inputs
- Background: Surface color
- Border: 1px solid border color
- Focus: Primary color ring
- Border radius: 0.5rem (rounded-lg)
- Padding: 0.75rem

### Avatars
- Shape: Circle
- Border: 2px solid (gold/pink when online, gray when offline)
- Sizes: sm (32px), md (48px), lg (64px)
- Ring effect when online: outer ring with primary color

## Animation Guidelines

### Durations
- **Instant**: < 100ms (micro-interactions)
- **Fast**: 150-200ms (button hovers, toggles)
- **Standard**: 250-300ms (page transitions, reveals)
- **Slow**: 400-500ms (entrance animations)

### Easing
- **Default**: cubic-bezier(0.4, 0.0, 0.2, 1)
- **Bounce**: cubic-bezier(0.68, -0.55, 0.265, 1.55)
- **Exit**: cubic-bezier(0.4, 0.0, 1, 1)

### Key Animations
1. **Presence glow**: Pulsing ring around avatar (2s loop)
2. **Page transitions**: Fade + slight slide (300ms)
3. **New content**: Fade in from top (250ms)
4. **Loading**: Gentle skeleton pulse

### Custom Animations
- **Heart Scale Hover**: Avoid generic hover states on buttons (like simple floating or scaling). Instead, use a custom "heart scale" animation where a heart shape starts at the center of the button and scales up until it covers the entire button. This provides a delightful, thematic micro-interaction.

## Iconography

### Style
- Stroke-based (not filled)
- 24px default size
- 2px stroke width
- Rounded line caps
- From Lucide React library

### Usage
- Navigation: Use consistent icons for each room
- Actions: Clear, recognizable symbols
- Status: Color-coded (gold = active, gray = inactive)

## Spacing System

```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-12: 3rem;     /* 48px */
```

## Accessibility

### Minimum Requirements
- Text contrast ratio: 4.5:1 (normal text), 3:1 (large text)
- Touch targets: Minimum 44px × 44px
- Focus indicators: Visible 2px outline in primary color
- Alt text: All images and icons

### Motion
- Respect prefers-reduced-motion
- Provide static alternatives to all animations

## Brand Personality

**If Lover-HQ were a person:**
- Warm friend who remembers the little things
- Never pushy, always patient
- Celebrates connection over efficiency
- Speaks in lowercase when casual, proper case when important
- Uses "we" and "us" (the couple) vs "you" (individual)

## Don'ts

❌ No unnecessary card wrappers (place content directly on the background to keep the mobile look)
❌ No generic float or scale hover effects (use shaped liquid fills instead)
❌ No gradients (keep flat colors)  
❌ No drop shadows (subtle box-shadows only)  
❌ No emojis in UI chrome (reserve for user content)  
❌ No bright red (use pink/gold for positives, gray for neutrals)  
❌ No generic stock imagery  
❌ No notification badges (use subtle indicators instead)
