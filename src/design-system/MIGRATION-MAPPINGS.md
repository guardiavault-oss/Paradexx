# Design System Migration Mappings

Use these find-and-replace patterns to migrate existing components to the design system.

## Quick Migration Commands

Run these in your IDE's find-and-replace (with regex enabled):

### Background Colors

| Find | Replace With |
|------|--------------|
| `bg-white/5` | `bg-[var(--bg-hover)]` |
| `bg-white/10` | `bg-[var(--glass-light)]` |
| `bg-white/8` | `bg-[var(--glass-medium)]` |
| `bg-white/12` | `bg-[var(--glass-strong)]` |
| `bg-white/15` | `bg-[var(--glass-strong)]` |
| `bg-white/20` | `bg-[var(--glass-heavy)]` |
| `bg-black` | `bg-[var(--bg-base)]` |
| `bg-black/60` | `bg-[var(--bg-overlay)]` |
| `bg-black/80` | `bg-[var(--bg-elevated)]` |
| `bg-black/95` | `bg-[var(--bg-surface)]` |
| `rgba(255, 255, 255, 0.05)` | `var(--bg-hover)` |
| `rgba(255, 255, 255, 0.1)` | `var(--glass-light)` |
| `rgba(0, 0, 0, 0.6)` | `var(--glass-medium)` |
| `rgba(0, 0, 0, 0.8)` | `var(--bg-elevated)` |
| `rgba(0, 0, 0, 0.95)` | `var(--bg-surface)` |

### Border Colors

| Find | Replace With |
|------|--------------|
| `border-white/5` | `border-[var(--border-neutral-subtle)]` |
| `border-white/10` | `border-[var(--border-neutral)]` |
| `border-white/20` | `border-[var(--border-neutral-strong)]` |
| `border-white/30` | `border-[var(--border-neutral-strong)]` |
| `rgba(255, 255, 255, 0.06)` | `var(--border-neutral-subtle)` |
| `rgba(255, 255, 255, 0.1)` | `var(--border-neutral)` |
| `rgba(255, 255, 255, 0.2)` | `var(--border-neutral-strong)` |

### Text Colors

| Find | Replace With |
|------|--------------|
| `text-white` | `text-[var(--text-primary)]` |
| `text-white/90` | `text-[var(--text-primary)]` |
| `text-white/80` | `text-[var(--text-secondary)]` |
| `text-white/70` | `text-[var(--text-secondary)]` |
| `text-white/60` | `text-[var(--text-tertiary)]` |
| `text-white/50` | `text-[var(--text-muted)]` |
| `text-white/40` | `text-[var(--text-muted)]` |
| `rgba(255, 255, 255, 0.9)` | `var(--text-primary)` |
| `rgba(255, 255, 255, 0.7)` | `var(--text-secondary)` |
| `rgba(255, 255, 255, 0.6)` | `var(--text-tertiary)` |
| `rgba(255, 255, 255, 0.4)` | `var(--text-muted)` |

### Theme Colors (Degen)

Replace inline style patterns:

```javascript
// BEFORE:
const accentColor = isDegen ? '#DC143C' : '#0080FF';
style={{ background: accentColor }}

// AFTER:
import { getThemeStyles } from '@/design-system';
const theme = getThemeStyles(type);
style={{ background: theme.primaryColor }}

// OR use CSS variables:
style={{ background: 'var(--degen-primary)' }} // or var(--regen-primary)
```

### Hardcoded Colors to Remove

| Find | Replace With |
|------|--------------|
| `#DC143C` | `var(--degen-primary)` |
| `#8B0000` | `var(--degen-secondary)` |
| `#FF4500` | `var(--degen-tertiary)` |
| `#0080FF` | `var(--regen-primary)` |
| `#000080` | `var(--regen-secondary)` |
| `#00CED1` | `var(--regen-tertiary)` |

### Border Radius

| Find | Replace With |
|------|--------------|
| `rounded-lg` | `rounded-[var(--radius-lg)]` |
| `rounded-xl` | `rounded-[var(--radius-xl)]` |
| `rounded-2xl` | `rounded-[var(--radius-2xl)]` |
| `rounded-3xl` | `rounded-[var(--radius-3xl)]` |
| `border-radius: 12px` | `border-radius: var(--radius-lg)` |
| `border-radius: 16px` | `border-radius: var(--radius-xl)` |
| `border-radius: 24px` | `border-radius: var(--radius-2xl)` |

### Shadows

| Find | Replace With |
|------|--------------|
| `shadow-lg` | `shadow-[var(--shadow-lg)]` |
| `shadow-xl` | `shadow-[var(--shadow-xl)]` |
| `shadow-2xl` | `shadow-[var(--shadow-2xl)]` |

### Backdrop Blur

| Find | Replace With |
|------|--------------|
| `backdrop-blur-sm` | `backdrop-blur-[var(--blur-sm)]` |
| `backdrop-blur-md` | `backdrop-blur-[var(--blur-md)]` |
| `backdrop-blur-lg` | `backdrop-blur-[var(--blur-lg)]` |
| `backdrop-blur-xl` | `backdrop-blur-[var(--blur-xl)]` |
| `backdrop-blur-2xl` | `backdrop-blur-[var(--blur-2xl)]` |
| `blur(20px)` | `blur(var(--blur-lg))` |
| `blur(40px)` | `blur(var(--blur-2xl))` |

### Typography

| Find | Replace With |
|------|--------------|
| `text-xs` | `text-[var(--text-xs)]` |
| `text-sm` | `text-[var(--text-sm)]` |
| `text-base` | `text-[var(--text-base)]` |
| `text-lg` | `text-[var(--text-lg)]` |
| `text-xl` | `text-[var(--text-xl)]` |
| `text-2xl` | `text-[var(--text-2xl)]` |
| `text-3xl` | `text-[var(--text-3xl)]` |
| `font-medium` | `font-[var(--font-weight-medium)]` |
| `font-semibold` | `font-[var(--font-weight-semibold)]` |
| `font-bold` | `font-[var(--font-weight-bold)]` |
| `font-black` | `font-[var(--font-weight-black)]` |

### Spacing (Use existing Tailwind classes, they work with tokens)

Keep spacing classes like `p-4`, `p-6`, `gap-4`, `mb-4` etc. as they align with the 4px grid.

### Transitions

| Find | Replace With |
|------|--------------|
| `transition-all duration-200` | `transition-all duration-[var(--duration-normal)]` |
| `transition-all duration-300` | `transition-all duration-[var(--duration-moderate)]` |
| `transition-all duration-150` | `transition-all duration-[var(--duration-fast)]` |
| `ease-out` | `ease-[var(--ease-out)]` |
| `ease-in-out` | `ease-[var(--ease-in-out)]` |

---

## Component Migration Pattern

### Before (Hardcoded)

```tsx
<div className="p-6 rounded-xl bg-white/5 border border-white/10">
  <h3 className="text-base font-bold text-white">Title</h3>
  <p className="text-sm text-white/60">Description</p>
  <button 
    className="px-4 py-2 rounded-lg font-bold"
    style={{ background: isDegen ? '#DC143C' : '#0080FF' }}
  >
    Action
  </button>
</div>
```

### After (Design System)

```tsx
<div className="p-6 rounded-[var(--radius-xl)] bg-[var(--glass-light)] border border-[var(--border-neutral)]">
  <h3 className="text-[var(--text-base)] font-[var(--font-weight-bold)] text-[var(--text-primary)]">Title</h3>
  <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">Description</p>
  <button 
    className={cn(
      "px-4 py-2 rounded-[var(--radius-lg)] font-[var(--font-weight-bold)]",
      "transition-all duration-[var(--duration-normal)]",
      type === 'degen' 
        ? "bg-[var(--degen-primary)] hover:bg-[var(--degen-secondary)] shadow-[var(--shadow-degen-sm)]"
        : "bg-[var(--regen-primary)] hover:bg-[var(--regen-secondary)] shadow-[var(--shadow-regen-sm)]"
    )}
  >
    Action
  </button>
</div>
```

### Or use the ThemedCard component

```tsx
import { ThemedCard, ThemedButton } from '@/design-system';

<ThemedCard theme={type} variant="glass" padding="md">
  <h3 className="text-[var(--text-base)] font-[var(--font-weight-bold)]">Title</h3>
  <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">Description</p>
  <ThemedButton theme={type} variant="primary">
    Action
  </ThemedButton>
</ThemedCard>
```

---

## Utility Classes Available

Instead of inline styles, use these utility classes from `globals.css`:

### Glass Classes

- `.glass` - Standard glass surface
- `.glass-subtle` - Light glass
- `.glass-strong` - Heavy glass
- `.glass-degen` - Degen-tinted glass
- `.glass-regen` - Regen-tinted glass

### Focus Classes

- `.focus-ring` - Standard focus ring
- `.focus-ring-degen` - Degen focus ring
- `.focus-ring-regen` - Regen focus ring
- `.focus-glow` - Focus with glow

### Animation Classes

- `.animate-fade-in`
- `.animate-fade-in-up`
- `.animate-scale-in`
- `.animate-blur-in-up`
- `.animate-pulse-glow-degen`
- `.animate-pulse-glow-regen`

### Interactive Classes

- `.interactive` - Hover lift + scale on active
- `.interactive-scale` - Scale on hover

### Loading

- `.skeleton` - Skeleton loading shimmer

---

## Priority Files to Migrate

High-impact files (sorted by number of hardcoded values):

1. `Settings.tsx` (29 occurrences)
2. `SmartWillBuilder.tsx` (20 occurrences)
3. `TradingPageEnhanced.tsx` (19 occurrences)
4. `modals/SendModal.tsx` (17 occurrences)
5. `tokens/TokenDetail.tsx` (15 occurrences)
6. `SettingsModal.tsx` (12 occurrences)
7. `BuyPage.tsx` (11 occurrences)
8. `SwapPageEnhanced.tsx` (11 occurrences)
9. `AirdropPage.tsx` (10 occurrences)
10. `SkeletonLoader.tsx` (9 occurrences)
