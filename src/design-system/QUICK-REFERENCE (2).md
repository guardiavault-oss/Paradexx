# Token Quick Reference Card

Fast lookup guide for common token migrations. Print or bookmark this page!

---

## 🚀 Quick Start

```bash
# Run migration
npx tsx design-system/migrate-tokens.ts --dry-run --verbose
```

```typescript
// New imports
import { palette, colors, modeColors, typography, spacing, radius, shadows, blur } from '@/design-system/tokens';
import { getAccentColor, getGradient, getGlow } from '@/design-system/tokens';
```

---

## 🎨 Colors - Top 10 Most Used

| Pattern | Old | New |
|---------|-----|-----|
| Background | `rgba(0, 0, 0, 0.95)` | `colors.background.primary` |
| Glass | `rgba(0, 0, 0, 0.6)` | `colors.background.glass.medium` |
| Text | `rgba(255, 255, 255, 0.7)` | `colors.text.secondary` |
| Border | `rgba(255, 255, 255, 0.1)` | `colors.border.subtle` |
| Degen | `#ff3366` | `palette.degen.primary` |
| Regen | `#00d4ff` | `palette.regen.primary` |
| Mode Color | `mode === 'degen' ? '#ff3366' : '#00d4ff'` | `getAccentColor(mode, 'primary')` |
| Gradient | `linear-gradient(90deg, #ff3366, #ff9500)` | `getGradient('degen', 'primary')` |
| Glow | `0 0 40px rgba(255, 51, 102, 0.4)` | `getGlow('degen', 'md')` |
| Hover | `rgba(255, 255, 255, 0.1)` | `colors.interactive.hover` |

---

## 📦 Component Patterns

### Glassmorphism Card
```tsx
// Old
<div style={{
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>

// New - Option 1 (CSS class)
<div className="glass-medium">

// New - Option 2 (Component)
<GlassCard intensity="medium">

// New - Option 3 (Tokens)
<div style={{
  backgroundColor: colors.background.glass.medium,
  backdropFilter: `blur(${blur.md})`,
  border: `1px solid ${colors.border.subtle}`
}}>
```

### Mode-Aware Button
```tsx
// Old
<button style={{
  backgroundColor: type === 'degen' ? '#ff3366' : '#00d4ff',
  boxShadow: type === 'degen' 
    ? '0 0 40px rgba(255, 51, 102, 0.4)' 
    : '0 0 40px rgba(0, 212, 255, 0.4)'
}}>

// New
<button style={{
  backgroundColor: getAccentColor(type, 'primary'),
  boxShadow: getGlow(type, 'md')
}}>

// Or with CSS
<button className="btn-primary" data-mode={type}>
```

### Gradient Background
```tsx
// Old
style={{
  background: 'linear-gradient(90deg, #ff3366, #ff9500)'
}}

// New
style={{
  background: getGradient('degen', 'primary')
}}

// Or
style={{
  background: modeColors.degen.gradient.primary
}}
```

---

## 🎯 CSS Variables

### Most Common
```css
/* Background */
var(--bg-primary)           /* rgba(0, 0, 0, 0.95) */
var(--bg-glass-medium)      /* rgba(0, 0, 0, 0.6) */

/* Text */
var(--text-primary)         /* #ffffff */
var(--text-secondary)       /* rgba(255, 255, 255, 0.7) */

/* Borders */
var(--border-subtle)        /* rgba(255, 255, 255, 0.1) */
var(--border-normal)        /* rgba(255, 255, 255, 0.2) */

/* Mode-Aware (auto-switches) */
var(--accent-primary)       /* Degen: #ff3366, Regen: #00d4ff */
var(--glow-md)              /* Mode-specific glow */

/* Effects */
var(--blur-md)              /* 20px */
var(--shadow-md)            /* 0 20px 60px rgba(0, 0, 0, 0.5) */

/* Spacing */
var(--radius-xl)            /* 24px */
var(--spacing-card)         /* 24px */
```

---

## 📱 Utility Classes

```css
/* Glass Effects */
.glass-subtle               /* Light glass effect */
.glass-medium              /* Standard glass */
.glass-strong              /* Heavy glass */

/* Buttons */
.btn-base                  /* Base button styles */
.btn-primary               /* Primary button */
.btn-secondary             /* Outline button */
.btn-ghost                 /* Transparent button */

/* Text Effects */
.text-gradient             /* Rainbow gradient text */
.text-glow                 /* White glow */
.text-3d-degen             /* 3D Degen text shadow */
.text-3d-regen             /* 3D Regen text shadow */

/* Animations */
.animate-gradient          /* Gradient shift animation */
.animate-pulse-glow        /* Pulsing glow */
.fade-in                   /* Fade in */
.slide-up                  /* Slide up fade in */

/* Layout */
.container-center          /* Centered container */
.section-spacing           /* Section padding */
```

---

## 🔧 Utility Functions

```typescript
// Get mode-specific accent color
getAccentColor(mode: 'degen' | 'regen', variant: 'primary' | 'secondary' | 'tertiary')
// Example: getAccentColor('degen', 'primary') → '#ff3366'

// Get mode-specific gradient
getGradient(mode: 'degen' | 'regen', type: 'primary' | 'button' | 'background' | 'radial')
// Example: getGradient('regen', 'primary') → 'linear-gradient(90deg, #00d4ff, #00ff88)'

// Get mode-specific glow
getGlow(mode: 'degen' | 'regen', size: 'sm' | 'md' | 'lg' | 'xl' | 'elevated' | 'tunnel')
// Example: getGlow('degen', 'md') → '0 0 40px rgba(255, 51, 102, 0.4)'
```

---

## 📊 Color Palette Reference

### Degen (Fire)
```typescript
palette.degen.primary    // #ff3366 - Main brand
palette.degen.secondary  // #ff9500 - Orange accent
palette.degen.tertiary   // #ff6b6b - Light red
```

### Regen (Ice)
```typescript
palette.regen.primary    // #00d4ff - Main brand
palette.regen.secondary  // #00ff88 - Green accent
palette.regen.tertiary   // #00aaff - Light blue
```

### Neutrals
```typescript
palette.neutral[100]     // rgba(255, 255, 255, 0.1)
palette.neutral[200]     // rgba(255, 255, 255, 0.2)
palette.neutral[500]     // rgba(255, 255, 255, 0.5)
palette.neutral[700]     // rgba(255, 255, 255, 0.7)
```

---

## 🎭 Mode-Specific Tokens

### Degen Mode
```typescript
modeColors.degen.accent.primary           // #ff3366
modeColors.degen.background.light         // rgba(255, 51, 102, 0.1)
modeColors.degen.border.normal            // rgba(255, 51, 102, 0.4)
modeColors.degen.glow.normal              // rgba(255, 51, 102, 0.4)
modeColors.degen.gradient.primary         // linear-gradient(...)
```

### Regen Mode
```typescript
modeColors.regen.accent.primary           // #00d4ff
modeColors.regen.background.light         // rgba(0, 212, 255, 0.1)
modeColors.regen.border.normal            // rgba(0, 212, 255, 0.4)
modeColors.regen.glow.normal              // rgba(0, 212, 255, 0.4)
modeColors.regen.gradient.primary         // linear-gradient(...)
```

---

## 📐 Spacing & Layout

```typescript
// Spacing
spacing[4]              // 16px
spacing[6]              // 24px
spacing.card.md         // 24px
spacing.section.md      // 48px

// Border Radius
radius.md               // 12px
radius.xl               // 24px
radius['2xl']           // 32px
radius.full             // 9999px

// Shadows
shadows.md              // 0 20px 60px rgba(0, 0, 0, 0.5)
shadows.glow.degen.md   // 0 0 40px rgba(255, 51, 102, 0.4)

// Blur
blur.md                 // 20px
blur.lg                 // 40px
```

---

## ✏️ Typography

```typescript
// Font Family
typography.fontFamily.primary    // 'Rajdhani', sans-serif

// Font Size
typography.fontSize.hero         // clamp(48px, 10vw, 120px)
typography.fontSize.title        // clamp(32px, 5vw, 48px)
typography.fontSize.body         // clamp(14px, 2vw, 18px)

// Font Weight
typography.fontWeight.black      // 900
typography.fontWeight.bold       // 700
typography.fontWeight.semibold   // 600

// Letter Spacing
typography.letterSpacing.widest  // 0.2em (for uppercase)
```

---

## 🔄 Find & Replace Shortcuts

Common patterns for manual find-and-replace:

| Find | Replace |
|------|---------|
| `'rgba(0, 0, 0, 0.95)'` | `colors.background.primary` |
| `'rgba(0, 0, 0, 0.6)'` | `colors.background.glass.medium` |
| `'rgba(255, 255, 255, 0.1)'` | `colors.border.subtle` |
| `'#ff3366'` | `palette.degen.primary` |
| `'#00d4ff'` | `palette.regen.primary` |
| `className="glass-light"` | `className="glass-subtle"` |
| `className="glass-default"` | `className="glass-medium"` |
| `'blur(20px)'` | `` `blur(${blur.md})` `` |

---

## 🚨 Common Mistakes

### ❌ Don't Do This
```typescript
// Hardcoded colors
color: '#ff3366'

// Old token names
colors.bg.base

// Non-semantic naming
backgroundColor: 'rgba(0, 0, 0, 0.6)'

// Mode checking everywhere
const color = mode === 'degen' ? '#ff3366' : '#00d4ff'
```

### ✅ Do This Instead
```typescript
// Use palette
color: palette.degen.primary

// New semantic tokens
colors.background.primary

// Semantic tokens
backgroundColor: colors.background.glass.medium

// Utility functions
const color = getAccentColor(mode, 'primary')
```

---

## 📚 File Locations

| File | Purpose |
|------|---------|
| `design-system/tokens.ts` | All token definitions |
| `design-system/globals.css` | CSS variables & utilities |
| `design-system/token-mapping.json` | Complete migration mapping |
| `design-system/migrate-tokens.ts` | Migration script |
| `design-system/MIGRATION-GUIDE.md` | Detailed migration guide |
| `design-system/components/GlassCard.tsx` | Reusable glass component |

---

**Pro Tip:** Bookmark this page and keep it open while migrating!

**Version:** 1.0.0 | **Last Updated:** December 4, 2024
