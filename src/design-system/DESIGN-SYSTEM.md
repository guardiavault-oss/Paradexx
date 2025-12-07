# Paradox Wallet Design System

**Version:** 1.0.0  
**Last Updated:** December 2025

A comprehensive, production-ready design system for the Paradox Wallet application. This system provides semantic tokens, reusable components, and clear usage guidelines for maintaining visual consistency across degen (fire/aggressive) and regen (ice/calm) modes.

---

## 📚 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Components](#components)
- [Utilities](#utilities)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

---

## Overview

### Design Principles

1. **Semantic Naming** - Use purpose-based names (`surface-primary`) not descriptive (`dark-gray`)
2. **Mode Awareness** - All accent colors adapt to degen/regen modes
3. **Consistency** - Single source of truth for all design decisions
4. **Accessibility** - WCAG AA compliant contrast ratios
5. **Performance** - Optimized for production use

### Key Features

- ✅ Consolidated color palette (reduced from 300+ to ~50 tokens)
- ✅ Semantic naming convention
- ✅ Mode-aware accent colors (degen/regen)
- ✅ Glassmorphism components with variants
- ✅ Responsive typography with clamp()
- ✅ Tailwind integration
- ✅ CSS custom properties for runtime theming

---

## Installation

### 1. Import Tokens

```typescript
// In your component
import { colors, typography, spacing, getAccentColor } from '@/design-system/tokens';

// Get mode-specific color
const primaryColor = getAccentColor('degen', 'primary'); // #ff3366
```

### 2. Use Tailwind Classes

```tsx
// Tailwind classes from extended config
<div className="bg-background-primary text-text-primary border-border-subtle rounded-xl">
  <h1 className="font-primary font-black text-title">Title</h1>
</div>
```

### 3. Use CSS Custom Properties

```css
/* In your CSS */
.my-component {
  background-color: var(--bg-glass-medium);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(var(--blur-md));
}
```

### 4. Use Utility Classes

```tsx
<div className="glass-card">
  <p className="text-gradient">Gradient text</p>
</div>
```

---

## Core Concepts

### Semantic Naming

**❌ DON'T use descriptive names:**
```typescript
const darkPurple = '#1a1a2e';
const lightGray = '#cccccc';
const redGlow = 'rgba(255, 0, 0, 0.5)';
```

**✅ DO use semantic names:**
```typescript
const surfacePrimary = colors.surface.base;
const textMuted = colors.text.muted;
const accentGlow = modeColors.degen.glow.normal;
```

### Mode System

The design system supports two modes:

**Degen Mode** (Fire/Aggressive):
- Primary: `#ff3366` (hot pink/red)
- Secondary: `#ff9500` (orange)
- Personality: Bold, aggressive, high-energy

**Regen Mode** (Ice/Calm):
- Primary: `#00d4ff` (cyan)
- Secondary: `#00ff88` (green)
- Personality: Cool, calculated, sustainable

### Token Categories

1. **Palette Tokens** - Raw colors (`palette.degen.primary`)
2. **Semantic Tokens** - Purpose-based (`colors.text.primary`)
3. **Mode Tokens** - Context-aware (`modeColors.degen.accent`)
4. **Utility Functions** - Helpers (`getAccentColor()`)

---

## Color System

### Base Palette

```typescript
import { palette } from '@/design-system/tokens';

palette.white      // #ffffff
palette.black      // #000000
palette.degen.primary    // #ff3366
palette.regen.primary    // #00d4ff
```

### Semantic Colors

#### Backgrounds

```typescript
colors.background.primary    // rgba(0, 0, 0, 0.95) - Main app background
colors.background.secondary  // rgba(0, 0, 0, 0.8)  - Secondary surfaces
colors.background.tertiary   // rgba(0, 0, 0, 0.4)  - Light backgrounds
colors.background.overlay    // rgba(0, 0, 0, 0.7)  - Modal overlays
```

**Usage:**
```tsx
<div style={{ backgroundColor: colors.background.primary }}>
  {/* Main content */}
</div>
```

#### Text Colors

```typescript
colors.text.primary     // #ffffff - Main text
colors.text.secondary   // rgba(255, 255, 255, 0.7) - Secondary text
colors.text.tertiary    // rgba(255, 255, 255, 0.6) - Tertiary text
colors.text.muted       // rgba(255, 255, 255, 0.4) - Disabled/muted
```

**Usage:**
```tsx
<h1 style={{ color: colors.text.primary }}>Title</h1>
<p style={{ color: colors.text.secondary }}>Subtitle</p>
<span style={{ color: colors.text.muted }}>Meta info</span>
```

#### Borders

```typescript
colors.border.subtle    // rgba(255, 255, 255, 0.1) - MOST COMMON
colors.border.normal    // rgba(255, 255, 255, 0.2) - Standard
colors.border.strong    // rgba(255, 255, 255, 0.3) - Emphasized
colors.border.focus     // rgba(255, 255, 255, 0.5) - Focus states
```

### Mode-Specific Colors

#### Getting Mode Colors

```typescript
import { getAccentColor, getGradient, getGlow } from '@/design-system/tokens';

// Get accent color
const primaryColor = getAccentColor('degen', 'primary');  // #ff3366
const secondaryColor = getAccentColor('regen', 'secondary'); // #00ff88

// Get gradient
const buttonGradient = getGradient('degen', 'button');

// Get glow shadow
const glowShadow = getGlow('regen', 'md');
```

#### Direct Access

```typescript
import { modeColors } from '@/design-system/tokens';

// Degen colors
modeColors.degen.accent.primary       // #ff3366
modeColors.degen.background.light     // rgba(255, 51, 102, 0.1)
modeColors.degen.border.normal        // rgba(255, 51, 102, 0.4)
modeColors.degen.glow.strong          // rgba(255, 51, 102, 0.8)

// Regen colors
modeColors.regen.accent.primary       // #00d4ff
modeColors.regen.background.light     // rgba(0, 212, 255, 0.1)
modeColors.regen.border.normal        // rgba(0, 212, 255, 0.4)
modeColors.regen.glow.strong          // rgba(0, 212, 255, 0.8)
```

### Gradients

```typescript
// Degen gradients
modeColors.degen.gradient.primary     // linear-gradient(90deg, #ff3366, #ff9500)
modeColors.degen.gradient.button      // linear-gradient(135deg, #ff3366, #ff6b6b, #ff3366)
modeColors.degen.gradient.background  // Subtle background gradient

// Regen gradients
modeColors.regen.gradient.primary     // linear-gradient(90deg, #00d4ff, #00ff88)
modeColors.regen.gradient.button      // linear-gradient(135deg, #00d4ff, #00ff88, #00d4ff)
```

**Usage:**
```tsx
<div style={{ background: getGradient('degen', 'primary') }}>
  Progress bar
</div>
```

---

## Typography

### Font Families

```typescript
typography.fontFamily.primary  // 'Rajdhani', sans-serif - PRIMARY
typography.fontFamily.mono     // monospace - Code/technical
typography.fontFamily.system   // System fallback
```

**Usage:**
```tsx
<h1 style={{ fontFamily: typography.fontFamily.primary }}>Title</h1>
```

**Tailwind:**
```tsx
<h1 className="font-primary">Title</h1>
```

### Font Sizes

#### Responsive Sizes (Recommended)

```typescript
typography.fontSize.hero        // clamp(48px, 10vw, 120px)
typography.fontSize.title       // clamp(32px, 5vw, 48px)
typography.fontSize.heading     // clamp(24px, 4vw, 42px)
typography.fontSize.subheading  // clamp(20px, 2vw, 28px)
typography.fontSize.body        // clamp(14px, 2vw, 18px)
typography.fontSize.small       // clamp(12px, 2vw, 14px)
```

**Usage:**
```tsx
<h1 className="text-title">Page Title</h1>
<h2 className="text-heading">Section Heading</h2>
<p className="text-body">Body text</p>
```

#### Fixed Sizes

Use when you need precise control:
```tsx
<span className="text-14">14px text</span>
<span className="text-16">16px text</span>
<span className="text-24">24px text</span>
```

### Font Weights

```typescript
typography.fontWeight.black      // 900 - Main titles
typography.fontWeight.extrabold  // 800 - Section headers
typography.fontWeight.bold       // 700 - UI elements, buttons
typography.fontWeight.semibold   // 600 - Emphasis
typography.fontWeight.medium     // 500 - Body variants
typography.fontWeight.normal     // 400 - Default
```

**Tailwind:**
```tsx
<h1 className="font-black">Ultra Bold Title</h1>
<button className="font-bold">Button</button>
<p className="font-normal">Body text</p>
```

### Letter Spacing

```typescript
typography.letterSpacing.widest  // 0.2em - MOST COMMON for uppercase
typography.letterSpacing.wider   // 0.1em
typography.letterSpacing.wide    // 0.05em
typography.letterSpacing.normal  // 0em
typography.letterSpacing.tight   // -0.01em
typography.letterSpacing.tighter // -0.02em
```

**Best Practice for Uppercase:**
```tsx
<div className="uppercase tracking-widest">
  UPPERCASE LABEL
</div>
```

### Typography Patterns

**Page Title:**
```tsx
<h1 className="font-primary font-black text-title tracking-tight uppercase">
  Page Title
</h1>
```

**Section Heading:**
```tsx
<h2 className="font-primary font-extrabold text-heading tracking-wide uppercase">
  Section Title
</h2>
```

**Body Text:**
```tsx
<p className="font-primary font-normal text-body text-text-secondary leading-relaxed">
  Body content goes here.
</p>
```

**Small Label:**
```tsx
<span className="font-primary font-extrabold text-small tracking-widest uppercase text-text-muted">
  Label
</span>
```

---

## Spacing & Layout

### Spacing Scale

```typescript
spacing[1]  // 4px
spacing[2]  // 8px   - Tight gaps
spacing[3]  // 12px
spacing[4]  // 16px  - Standard gap
spacing[6]  // 24px  - Card padding (MOST COMMON)
spacing[8]  // 32px  - Large spacing
spacing[12] // 48px  - Section spacing
spacing[16] // 64px  - Major sections
```

**Tailwind:**
```tsx
<div className="p-6 mb-8 gap-4">
  {/* padding: 24px, margin-bottom: 32px, gap: 16px */}
</div>
```

### Semantic Spacing

```typescript
spacing.button.sm  // 8px 16px
spacing.button.md  // 12px 16px
spacing.button.lg  // 16px 32px

spacing.card.sm    // 16px
spacing.card.md    // 24px - MOST COMMON
spacing.card.lg    // 32px

spacing.section.md // 48px - MOST COMMON
spacing.section.lg // 64px
```

### Border Radius

```typescript
radius.sm      // 8px
radius.md      // 12px
radius.lg      // 16px
radius.xl      // 24px  - MOST COMMON for cards
radius['2xl']  // 32px
radius['3xl']  // 40px
radius.full    // 9999px - Circular
```

**Tailwind:**
```tsx
<div className="rounded-xl">Card</div>        {/* 24px */}
<button className="rounded-full">Btn</button> {/* circular */}
```

---

## Components

### GlassCard

Reusable glassmorphism card with mode-aware styling.

#### Basic Usage

```tsx
import { GlassCard } from '@/design-system/components/GlassCard';

<GlassCard
  intensity="medium"
  mode="degen"
  accent
  hoverable
>
  <h2>Card Title</h2>
  <p>Card content</p>
</GlassCard>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `intensity` | `'subtle' \| 'medium' \| 'strong'` | `'medium'` | Glass effect strength |
| `mode` | `'degen' \| 'regen'` | - | Mode for accent colors |
| `accent` | `boolean` | `false` | Use accent-colored border |
| `hoverable` | `boolean` | `false` | Enable hover effects |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Padding size |
| `rounded` | `'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'` | `'xl'` | Border radius |
| `glow` | `boolean` | `false` | Add glow shadow |

#### Intensity Examples

```tsx
{/* Subtle - light blur, minimal background */}
<GlassCard intensity="subtle">Light glass</GlassCard>

{/* Medium - standard glassmorphism */}
<GlassCard intensity="medium">Standard glass</GlassCard>

{/* Strong - heavy background, strong blur */}
<GlassCard intensity="strong">Heavy glass</GlassCard>
```

#### Mode-Aware Accent

```tsx
{/* Degen mode - red accent border */}
<GlassCard mode="degen" accent glow>
  Degen card with red glow
</GlassCard>

{/* Regen mode - blue accent border */}
<GlassCard mode="regen" accent glow>
  Regen card with blue glow
</GlassCard>
```

### GlassButton

Glass-styled button component.

```tsx
import { GlassButton } from '@/design-system/components/GlassCard';

{/* Primary button */}
<GlassButton mode="degen" variant="primary" size="md">
  Primary Action
</GlassButton>

{/* Secondary button */}
<GlassButton mode="regen" variant="secondary" size="lg">
  Secondary Action
</GlassButton>

{/* Ghost button */}
<GlassButton variant="ghost" size="sm">
  Ghost
</GlassButton>
```

#### Button Variants

- `primary` - Solid background with accent color
- `secondary` - Transparent with accent border
- `ghost` - Subtle background, minimal styling

### GlassPanel

Optimized for sidebars and panel layouts.

```tsx
import { GlassPanel } from '@/design-system/components/GlassCard';

<GlassPanel mode="degen" accent>
  <nav>{/* Navigation items */}</nav>
</GlassPanel>
```

---

## Utilities

### CSS Utility Classes

Available in `globals.css`:

#### Glassmorphism

```tsx
<div className="glass-subtle">Subtle glass effect</div>
<div className="glass-medium">Standard glass effect</div>
<div className="glass-strong">Strong glass effect</div>
<div className="glass-accent">Glass with accent border (mode-aware)</div>
<div className="glass-card">Pre-styled glass card</div>
```

#### Buttons

```tsx
<button className="btn-base btn-primary">Primary</button>
<button className="btn-base btn-secondary">Secondary</button>
<button className="btn-base btn-ghost">Ghost</button>
```

#### Text Effects

```tsx
<h1 className="text-gradient">Gradient text</h1>
<h1 className="text-glow">Glowing text</h1>
<h1 className="text-3d-degen">3D text (degen)</h1>
<h1 className="text-3d-regen">3D text (regen)</h1>
```

#### Animations

```tsx
<div className="animate-gradient">Animated gradient bg</div>
<div className="animate-pulse-glow">Pulsing glow</div>
<div className="fade-in">Fade in animation</div>
<div className="slide-up">Slide up animation</div>
```

### CSS Custom Properties

Use `data-mode` attribute to switch modes:

```tsx
<div data-mode="degen">
  {/* All CSS variables automatically switch to degen colors */}
  <style>
    {`
      .my-element {
        color: var(--accent-primary);  /* #ff3366 */
        background: var(--accent-bg-light);
        border: 1px solid var(--accent-border-normal);
        box-shadow: var(--glow-md);
      }
    `}
  </style>
</div>

<div data-mode="regen">
  {/* Same variables, different colors */}
  {/* --accent-primary is now #00d4ff */}
</div>
```

---

## Migration Guide

### Migrating Existing Code

#### Step 1: Replace Color Values

**Before:**
```typescript
const primaryColor = isDegen ? "#ff3333" : "#3399ff";
const borderColor = "rgba(255, 255, 255, 0.1)";
```

**After:**
```typescript
import { getAccentColor, colors } from '@/design-system/tokens';

const primaryColor = getAccentColor(isDegen ? 'degen' : 'regen', 'primary');
const borderColor = colors.border.subtle;
```

#### Step 2: Replace Inline Styles with Tokens

**Before:**
```tsx
<div style={{
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "24px",
  padding: "24px",
}}>
```

**After (Option 1 - Component):**
```tsx
<GlassCard intensity="medium" padding="md" rounded="xl">
```

**After (Option 2 - Utility Class):**
```tsx
<div className="glass-medium rounded-xl p-6">
```

**After (Option 3 - Tokens):**
```tsx
<div style={{
  backgroundColor: colors.background.secondary,
  backdropFilter: `blur(${blur.md})`,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.xl,
  padding: spacing[6],
}}>
```

#### Step 3: Update Typography

**Before:**
```tsx
<h1 style={{
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: "48px",
  fontWeight: 900,
  letterSpacing: "0.2em",
}}>
```

**After (Tailwind):**
```tsx
<h1 className="font-primary text-title font-black tracking-widest">
```

**After (Tokens):**
```tsx
<h1 style={{
  fontFamily: typography.fontFamily.primary,
  fontSize: typography.fontSize.title,
  fontWeight: typography.fontWeight.black,
  letterSpacing: typography.letterSpacing.widest,
}}>
```

---

## Best Practices

### ✅ DO

**Use semantic tokens:**
```tsx
background: colors.surface.elevated
color: colors.text.primary
border: colors.border.subtle
```

**Use mode-aware colors:**
```tsx
const accentColor = getAccentColor(mode, 'primary');
const gradient = getGradient(mode, 'button');
```

**Use consistent spacing:**
```tsx
<div className="p-6 mb-8 gap-4">
  {/* Uses spacing scale: 24px, 32px, 16px */}
</div>
```

**Use components for common patterns:**
```tsx
<GlassCard mode="degen" accent>
  {/* Consistent glassmorphism */}
</GlassCard>
```

**Use clamp() for responsive text:**
```tsx
<h1 className="text-title">
  {/* Scales from 32px to 48px */}
</h1>
```

### ❌ DON'T

**Don't use raw color values:**
```tsx
// ❌ Bad
backgroundColor: "#ff3366"
color: "rgba(255, 255, 255, 0.7)"

// ✅ Good
backgroundColor: getAccentColor('degen', 'primary')
color: colors.text.secondary
```

**Don't hardcode specific values:**
```tsx
// ❌ Bad
padding: "23px"
borderRadius: "13px"

// ✅ Good
padding: spacing[6]
borderRadius: radius.lg
```

**Don't mix inconsistent font sizes:**
```tsx
// ❌ Bad - arbitrary sizes
fontSize: "17px"
fontSize: "43px"

// ✅ Good - use scale
className="text-body"
className="text-heading"
```

**Don't create custom glass effects:**
```tsx
// ❌ Bad - inconsistent implementation
background: "rgba(0, 0, 0, 0.75)"
backdropFilter: "blur(15px)"
border: "1px solid rgba(255, 255, 255, 0.08)"

// ✅ Good - use component or utility
<GlassCard intensity="medium">
// or
className="glass-medium"
```

### When to Use Each Approach

**Use Components when:**
- Creating reusable UI elements
- Need consistent behavior across the app
- Want hover/interaction states handled automatically

**Use Tailwind when:**
- Building layouts quickly
- Need responsive utilities
- Working with standard patterns

**Use Tokens when:**
- Need dynamic values based on props/state
- Building custom components
- Require precise control

**Use CSS Variables when:**
- Need runtime theme switching
- Want to support user customization
- Building theme-able components

---

## Examples

### Complete Card Example

```tsx
import { GlassCard, GlassButton } from '@/design-system/components/GlassCard';
import { colors, typography } from '@/design-system/tokens';

function FeatureCard({ mode }: { mode: 'degen' | 'regen' }) {
  return (
    <GlassCard
      mode={mode}
      intensity="medium"
      accent
      hoverable
      glow
      padding="lg"
      rounded="xl"
    >
      <h2
        className="font-primary font-black text-heading tracking-wide uppercase mb-4"
        style={{ color: colors.text.primary }}
      >
        Feature Title
      </h2>
      
      <p
        className="font-primary font-normal text-body leading-relaxed mb-6"
        style={{ color: colors.text.secondary }}
      >
        Description of the feature with secondary text color.
      </p>
      
      <GlassButton
        mode={mode}
        variant="primary"
        size="md"
      >
        Learn More
      </GlassButton>
    </GlassCard>
  );
}
```

### Dashboard Layout Example

```tsx
function Dashboard({ mode }: { mode: 'degen' | 'regen' }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: modeColors[mode].gradient.radial,
      }}
      data-mode={mode}
    >
      {/* Header */}
      <header className="glass-medium p-6 border-b border-border-subtle">
        <h1 className="font-primary font-black text-title">
          Dashboard
        </h1>
      </header>
      
      {/* Main content */}
      <main className="container-center section-spacing">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard mode={mode} accent>
            <h3 className="font-bold text-heading mb-2">Card 1</h3>
            <p className="text-text-secondary">Content</p>
          </GlassCard>
          
          <GlassCard mode={mode} accent>
            <h3 className="font-bold text-heading mb-2">Card 2</h3>
            <p className="text-text-secondary">Content</p>
          </GlassCard>
          
          <GlassCard mode={mode} accent>
            <h3 className="font-bold text-heading mb-2">Card 3</h3>
            <p className="text-text-secondary">Content</p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
```

---

## Support & Contributing

### Questions?

- Check the token definitions in `/design-system/tokens.ts`
- Review component source in `/design-system/components/`
- See implementation examples in this guide

### Adding New Tokens

1. Add to appropriate section in `tokens.ts`
2. Update `tailwind.config.ts` if needed
3. Add CSS custom property to `globals.css`
4. Document usage in this guide
5. Add migration notes if breaking existing code

### Reporting Issues

If you find inconsistencies or missing tokens:
1. Check if similar token exists
2. Verify it's not in the deprecated list
3. Propose addition with use case

---

**Design System Version:** 1.0.0  
**Last Review:** December 2025
