# Paradox Design System Guide
**Version:** 1.0  
**Last Updated:** 2025-12-04

---

## Quick Start

### 1. Import Tokens (TypeScript/React)
```typescript
import { colors, typography, shadows, glass } from '@/styles/tokens';

// Use in components
<div style={{ background: colors.bg.surface }}>
```

### 2. Use CSS Variables (anywhere)
```css
.my-card {
  background: var(--bg-overlay);
  backdrop-filter: blur(var(--blur-md));
  border: 1px solid var(--border-subtle);
}
```

### 3. Use Utility Classes (Tailwind)
```html
<div className="glass-medium rounded-2xl p-6">
```

### 4. Use Glass Components
```tsx
import { GlassCard, GlassButton, GlassInput } from '@/components/ui/glass-card';

<GlassCard variant="medium" tribe="degen" glow>
  <GlassButton variant="primary" tribe="degen">
    Launch Sniper
  </GlassButton>
</GlassCard>
```

---

## Color System

### Backgrounds
```typescript
colors.bg.base         // #0a0a0a - Main app background
colors.bg.surface      // #1e1e1e - Cards, panels
colors.bg.elevated     // #2a2a2a - Modals, dropdowns
colors.bg.overlay      // rgba(10, 10, 15, 0.9) - Glass overlays
```

**When to use:**
- `base`: Body background, deep black areas
- `surface`: Default card background
- `elevated`: Modals, popovers, things "above" surface
- `overlay`: Glassmorphism cards with blur

---

### Text
```typescript
colors.text.primary    // #ffffff - Main text (white)
colors.text.secondary  // #e0e0e0 - Less important text
colors.text.muted      // #888888 - Helper text, labels
colors.text.disabled   // #666666 - Disabled states
```

**Hierarchy:**
- Headlines/CTAs: `primary`
- Body text: `primary` or `secondary`
- Labels/captions: `muted`
- Disabled: `disabled`

---

### Accents
```typescript
// Neutral (default app accent)
colors.accent.primary  // #00adef - Links, highlights
colors.accent.bright   // #00d4ff - Hover states
colors.accent.muted    // #0ea5e9 - Subtle accents
```

---

### Tribe Colors

#### Degen (Fire/Aggressive)
```typescript
colors.degen.DEFAULT   // #ff3333 - Primary red
colors.degen.accent    // #ff3366 - Pink-red
colors.degen.secondary // #ff9800 - Orange
colors.degen.glow      // rgba(255, 51, 51, 0.3) - For shadows
```

**When to use:**
- Sniper Bot, Whale Tracker, Meme Scanner
- High-risk features
- Aggressive CTAs
- Trading tools

---

#### Regen (Ice/Calm)
```typescript
colors.regen.DEFAULT   // #3399ff - Primary blue
colors.regen.accent    // #00d4ff - Bright cyan
colors.regen.secondary // #00ff88 - Green
colors.regen.glow      // rgba(0, 212, 255, 0.3) - For shadows
```

**When to use:**
- Wallet Guard, MEV Shield, Inheritance
- Security features
- Stable/long-term features
- Yield/DeFi tools

---

### Status Colors
```typescript
colors.success.DEFAULT  // #10b981 - Success messages, positive changes
colors.warning.DEFAULT  // #ffc107 - Warnings, cautions
colors.error.DEFAULT    // #ef4444 - Errors, failures
```

---

## Typography

### Font Families
```typescript
typography.fontFamily.display  // 'Rajdhani' - Headers, onboarding
typography.fontFamily.body     // System fonts - UI, body text
typography.fontFamily.mono     // Monospace - Addresses, codes
```

**Usage:**
- **Display (Rajdhani)**: Onboarding, landing pages, large headers, tribe selection
- **Body (System)**: Dashboard, modals, all UI components
- **Mono**: Wallet addresses, transaction hashes, seed phrases

---

### Font Sizes
```typescript
typography.fontSize.xs         // 12px - Labels, badges
typography.fontSize.sm         // 14px - Small body text
typography.fontSize.base       // 16px - Standard body
typography.fontSize.xl         // 20px - Subheadings
typography.fontSize['2xl']     // 24px - H3
typography.fontSize['3xl']     // 30px - H2
typography.fontSize['display-lg'] // 72px - Tunnel cards, split screen
```

---

### Font Weights

**Degen theme (aggressive):**
- Headers: 900 (black)
- Body: 700 (bold)

**Regen theme (calm):**
- Headers: 700 (bold)
- Body: 500 (medium)

```typescript
tribeTypography.degen.fontWeight.primary   // 900
tribeTypography.regen.fontWeight.primary   // 700
```

---

## Effects

### Glassmorphism Presets

```tsx
// Subtle (tooltips, overlays)
<div className="glass-subtle">

// Medium (cards, modals) - Most common
<div className="glass-medium">

// Strong (important cards)
<div className="glass-strong">

// Degen cards (red glow)
<div className="glass-degen">

// Regen cards (blue glow)
<div className="glass-regen">
```

**Or use the component:**
```tsx
<GlassCard variant="medium" tribe="degen" glow>
  {children}
</GlassCard>
```

---

### Shadows

```typescript
shadows.sm           // Subtle elevation
shadows.md           // Medium elevation
shadows.lg           // High elevation (modals)
shadows.xl           // Maximum elevation

shadows.glowDegen    // Red glow for Degen features
shadows.glowRegen    // Blue glow for Regen features
shadows.button       // Button shadow
```

**Usage:**
```tsx
style={{ boxShadow: shadows.glowDegen }}
className="shadow-glow-degen"  // Via Tailwind
```

---

### Blur

```typescript
blur.sm    // 10px - Subtle
blur.md    // 20px - Standard (most common)
blur.lg    // 30px - Heavy
blur.xl    // 40px - Maximum
```

**Usage:**
```tsx
style={{ backdropFilter: blur.md }}
className="backdrop-blur-xl"  // Via Tailwind
```

---

### Border Radius

```typescript
radius.md      // 12px - Buttons, inputs
radius.lg      // 16px - Cards
radius.xl      // 24px - Large cards
radius['3xl']  // 40px - Tunnel cards
radius.pill    // 9999px - Pill buttons
```

---

## Spacing

**Use Tailwind's default scale:**
- `0`, `1` (4px), `2` (8px), `3` (12px), `4` (16px)
- `6` (24px), `8` (32px), `12` (48px), `16` (64px)

**Examples:**
```html
<div className="p-6 gap-4 mb-8">
```

---

## Transitions

### Durations
```typescript
transitions.duration.fast     // 150ms - Micro-interactions
transitions.duration.normal   // 300ms - Standard (most common)
transitions.duration.slow     // 500ms - Smooth transitions
transitions.duration.slowest  // 1000ms - Fade transitions
```

### Easing
```typescript
transitions.ease.default  // Standard cubic-bezier
transitions.ease.smooth   // Smooth, polished feel
transitions.ease.bounce   // Playful bounce
```

**Usage:**
```tsx
transition={{ duration: 0.3 }}  // Framer Motion
className="transition-quick"     // CSS utility
```

---

## Component Examples

### Glass Card
```tsx
<GlassCard 
  variant="medium"     // subtle | medium | strong
  tribe="degen"        // neutral | degen | regen
  glow={true}          // Add glow shadow
  interactive={true}   // Add hover/tap effects
>
  <h3>Sniper Bot</h3>
  <p>Lightning-fast launches</p>
</GlassCard>
```

---

### Glass Button
```tsx
<GlassButton 
  variant="primary"    // primary | secondary | ghost
  tribe="degen"        // neutral | degen | regen
  size="md"            // sm | md | lg
  onClick={handleClick}
>
  Launch Snipe
</GlassButton>
```

---

### Glass Input
```tsx
<GlassInput 
  size="md"           // sm | md | lg
  error={hasError}    // Show error state
  placeholder="Enter amount..."
/>
```

---

## Do's and Don'ts

### ✅ DO
- Use semantic tokens (`colors.bg.surface`) instead of raw hex
- Use utility classes for common patterns (`glass-medium`)
- Apply tribe colors consistently (Degen = red, Regen = blue)
- Use the glassmorphism presets for consistency
- Stick to the transition duration scale

### ❌ DON'T
- Hardcode hex values (`#1e1e1e`)
- Create one-off shadows or blur values
- Mix tribe colors (red in Regen features)
- Use random opacity values (stick to 5%, 10%, 20%, etc.)
- Nest glassmorphism (blur stacking causes performance issues)

---

## Migration Guide

### Step 1: Import tokens
```diff
- <div style={{ background: '#1e1e1e' }}>
+ import { colors } from '@/styles/tokens';
+ <div style={{ background: colors.bg.surface }}>
```

### Step 2: Replace inline glass styles
```diff
- <div style={{
-   background: 'rgba(10, 10, 15, 0.9)',
-   backdropFilter: 'blur(20px)',
-   border: '1px solid rgba(128, 128, 128, 0.15)'
- }}>
+ <div className="glass-medium rounded-2xl">
```

### Step 3: Use Glass components
```diff
- <div className="p-6 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/10">
+ <GlassCard variant="medium" className="p-6">
```

---

## File Structure

```
src/styles/
├── tokens/
│   ├── colors.ts        # All color tokens
│   ├── typography.ts    # Font families, sizes, weights
│   ├── effects.ts       # Shadows, blur, radius, transitions
│   └── index.ts         # Centralized exports
├── design-system.css    # CSS custom properties + utilities
└── globals.css          # Global styles (imports design-system.css)

src/components/ui/
└── glass-card.tsx       # Reusable glass components
```

---

## Tribe Theming

### Switching tribes dynamically
```tsx
import { useTribeSafe } from '@/contexts/TribeTheme';

const { tribe, theme } = useTribeSafe();

// Use theme object (backward compatible)
<div style={{ color: theme.primary }}>

// Or use design tokens
<div style={{ color: tribe === 'degen' ? colors.degen.DEFAULT : colors.regen.DEFAULT }}>
```

---

## Browser Compatibility

- **Backdrop blur**: Supported in all modern browsers
- **CSS custom properties**: Full support
- **Glassmorphism**: May degrade gracefully on older devices

**Fallbacks built-in** for:
- No backdrop-filter support → solid background
- Reduced motion → instant transitions

---

## Performance Tips

1. **Avoid nesting glass elements** (blur stacking is expensive)
2. **Use `will-change: transform`** for animated glass cards
3. **Limit active blurs** on mobile (use lower blur values)
4. **Prefer utility classes** over inline styles (better caching)

---

## Accessibility

- **Text contrast**: All text meets WCAG AA standards
- **Focus states**: All interactive elements have visible focus rings
- **Motion**: Respects `prefers-reduced-motion`

---

## Examples in Production

### Dashboard Card
```tsx
<GlassCard variant="medium" className="p-6 rounded-2xl">
  <h3 className="text-xl font-bold text-white mb-4">
    Portfolio Value
  </h3>
  <p className="text-3xl font-black" style={{ color: colors.accent.primary }}>
    $24,500
  </p>
</GlassCard>
```

### Degen Feature Card
```tsx
<GlassCard variant="medium" tribe="degen" glow interactive>
  <div className="flex items-center gap-3 mb-4">
    <div className="w-12 h-12 rounded-xl bg-degen/20 flex items-center justify-center">
      <Crosshair className="w-6 h-6 text-degen" />
    </div>
    <h3 className="text-lg font-bold text-white">Sniper Bot</h3>
  </div>
  <p className="text-sm text-muted">
    Execute first-block buys on new pairs
  </p>
</GlassCard>
```

### Modal with Tribe Theme
```tsx
const { tribe } = useTribeSafe();

<GlassCard 
  variant="strong" 
  tribe={tribe}
  className="max-w-2xl mx-auto p-8 rounded-3xl"
>
  <h2 className="text-3xl font-black text-primary mb-6">
    Confirm Transaction
  </h2>
  <GlassButton variant="primary" tribe={tribe} size="lg">
    Confirm
  </GlassButton>
</GlassCard>
```

---

## Future Enhancements

1. **Dark mode toggle** (currently always dark)
2. **High contrast mode** for accessibility
3. **Custom tribe colors** (user-defined palettes)
4. **Animation intensity setting** (reduce motion for performance)
5. **Compact mode** (smaller spacing for mobile)

---

## Support

For questions or issues with the design system:
- Check `design-system-audit.md` for the analysis
- Review component examples in `src/components/ui/glass-card.tsx`
- See existing usage in `Dashboard.tsx` and `GlassOnboarding.tsx`

---

**Built with ❤️ for Paradox Wallet**

