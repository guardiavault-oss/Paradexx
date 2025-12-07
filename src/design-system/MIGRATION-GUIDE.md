# Token Migration Guide

Complete guide for migrating from the old design system to the new Paradox Wallet design system.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Manual Migration Reference](#manual-migration-reference)
4. [Automated Migration](#automated-migration)
5. [Component Updates](#component-updates)
6. [Common Patterns](#common-patterns)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The new design system consolidates 300+ unique design tokens into ~50 semantic tokens, providing:

- **Semantic naming** - Clear, purpose-driven token names
- **Mode-aware colors** - Automatic Degen/Regen color switching
- **Reduced complexity** - Fewer tokens, easier maintenance
- **Better DX** - Utility functions and type safety
- **CSS Variables** - Modern CSS custom properties support

### Breaking Changes

⚠️ **Important**: This is a breaking change migration. Review all changes carefully.

- Old token imports will not work
- Color values have been consolidated
- CSS variable names have changed
- Some utility classes have been renamed

---

## Quick Start

### 1. Run the Migration Script

```bash
# Dry run to see what will change (recommended first step)
npx tsx design-system/migrate-tokens.ts --dry-run --verbose

# Run migration with backup
npx tsx design-system/migrate-tokens.ts --backup

# Target specific directory
npx tsx design-system/migrate-tokens.ts --path=./components
```

### 2. Review Changes

Check the generated report:

```bash
cat design-system/migration-report.json
```

### 3. Update Imports

**Old:**
```typescript
import { colors } from '@/styles/tokens/colors';
import { effects } from '@/styles/tokens/effects';
```

**New:**
```typescript
import { palette, colors, modeColors, typography, spacing, radius, shadows, blur } from '@/design-system/tokens';
import { getAccentColor, getGradient, getGlow } from '@/design-system/tokens';
```

### 4. Test Thoroughly

- Visual regression testing
- Check all Degen/Regen mode switches
- Verify responsive behavior
- Test dark/light theme variations

---

## Manual Migration Reference

### TypeScript Token Mapping

#### Background Colors

| Old | New |
|-----|-----|
| `colors.bg.base` | `colors.background.primary` |
| `colors.bg.surface` | `colors.surface.base` |
| `colors.bg.elevated` | `colors.surface.elevated` |
| `colors.bg.overlay` | `colors.background.overlay` |
| `colors.bg.glass` | `colors.background.glass.medium` |
| `colors.bg.glass.light` | `colors.background.glass.subtle` |
| `colors.bg.glass.medium` | `colors.background.glass.medium` |
| `colors.bg.glass.heavy` | `colors.background.glass.strong` |

**Example:**
```typescript
// Old
const cardBg = colors.bg.glass;

// New
const cardBg = colors.background.glass.medium;
```

#### Brand Colors

| Old | New |
|-----|-----|
| `colors.degen.primary` | `palette.degen.primary` |
| `colors.degen.secondary` | `palette.degen.secondary` |
| `colors.degen.accent` | `palette.degen.tertiary` |
| `colors.regen.primary` | `palette.regen.primary` |
| `colors.regen.secondary` | `palette.regen.secondary` |
| `colors.regen.accent` | `palette.regen.tertiary` |

**Example:**
```typescript
// Old
const accentColor = mode === 'degen' ? colors.degen.primary : colors.regen.primary;

// New (better approach)
const accentColor = getAccentColor(mode, 'primary');

// Or directly
const accentColor = palette[mode].primary;
```

#### Text Colors

| Old | New |
|-----|-----|
| `colors.text.primary` | `colors.text.primary` ✓ (same) |
| `colors.text.secondary` | `colors.text.secondary` ✓ (same) |
| `colors.text.muted` | `colors.text.muted` ✓ (same) |
| `colors.text.disabled` | `colors.text.muted` |

#### Border Colors

| Old | New |
|-----|-----|
| `colors.border.default` | `colors.border.subtle` |
| `colors.border.medium` | `colors.border.normal` |
| `colors.border.strong` | `colors.border.strong` ✓ (same) |
| `colors.border.focus` | `colors.border.focus` ✓ (same) |

#### Effects

| Old | New |
|-----|-----|
| `effects.glass.subtle` | `colors.background.glass.subtle` |
| `effects.glass.medium` | `colors.background.glass.medium` |
| `effects.glass.strong` | `colors.background.glass.strong` |
| `effects.blur.sm` | `blur.sm` |
| `effects.blur.md` | `blur.md` |
| `effects.blur.lg` | `blur.lg` |
| `effects.shadow.sm` | `shadows.sm` |
| `effects.shadow.md` | `shadows.md` |
| `effects.shadow.lg` | `shadows.lg` |
| `effects.glow.degen` | `shadows.glow.degen.md` |
| `effects.glow.regen` | `shadows.glow.regen.md` |

#### Typography

| Old | New |
|-----|-----|
| `typography.font.primary` | `typography.fontFamily.primary` |
| `typography.size.hero` | `typography.fontSize.hero` |
| `typography.size.title` | `typography.fontSize.title` |
| `typography.weight.black` | `typography.fontWeight.black` |
| `typography.weight.bold` | `typography.fontWeight.bold` |

---

### CSS Variable Mapping

#### Core Variables

| Old | New |
|-----|-----|
| `--bg-base` | `--bg-primary` |
| `--bg-surface` | `--bg-glass-medium` |
| `--bg-elevated` | `--bg-secondary` |
| `--glass-subtle` | `--bg-glass-subtle` |
| `--glass-medium` | `--bg-glass-medium` |
| `--glass-strong` | `--bg-glass-strong` |

#### Mode-Aware Variables

Use `[data-mode="degen"]` or `[data-mode="regen"]` to access mode-specific variables:

```css
/* Automatically switches based on mode */
.button {
  background-color: var(--accent-primary);
  border: 1px solid var(--accent-border-normal);
  box-shadow: var(--glow-md);
}
```

**Available Mode Variables:**
- `--accent-primary`, `--accent-secondary`, `--accent-tertiary`
- `--accent-bg-subtle`, `--accent-bg-light`, `--accent-bg-medium`, `--accent-bg-strong`
- `--accent-border-subtle`, `--accent-border-normal`, `--accent-border-strong`
- `--glow-sm`, `--glow-md`, `--glow-lg`

---

### CSS Class Mapping

| Old | New |
|-----|-----|
| `.glass-light` | `.glass-subtle` |
| `.glass-default` | `.glass-medium` |
| `.glass-heavy` | `.glass-strong` |
| `.btn-outline` | `.btn-secondary` |
| `.btn-transparent` | `.btn-ghost` |
| `.text-gradient-degen` | `.text-gradient` |
| `.text-gradient-regen` | `.text-gradient` |
| `.animate-glow` | `.animate-pulse-glow` |
| `.fade-in-up` | `.slide-up` |

---

### Inline Style Patterns

#### Background Colors

```typescript
// Old
style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}

// New
style={{ backgroundColor: colors.background.primary }}

// Or use CSS variable
className="bg-[var(--bg-primary)]"
```

#### Borders

```typescript
// Old
style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}

// New
style={{ border: `1px solid ${colors.border.subtle}` }}
```

#### Backdrop Filter

```typescript
// Old
style={{ backdropFilter: 'blur(20px)' }}

// New
style={{ backdropFilter: `blur(${blur.md})` }}
```

#### Box Shadows

```typescript
// Old
style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}

// New
style={{ boxShadow: shadows.md }}
```

---

## Automated Migration

### Migration Script Features

The `migrate-tokens.ts` script automatically:

✅ Scans all `.tsx`, `.ts`, and `.css` files  
✅ Replaces old tokens with new equivalents  
✅ Updates import statements  
✅ Converts inline styles  
✅ Replaces color values  
✅ Updates CSS variables  
✅ Logs all changes made  
✅ Creates detailed JSON report  

### Usage Examples

```bash
# Dry run with verbose output
npx tsx design-system/migrate-tokens.ts --dry-run --verbose

# Live migration with backup files
npx tsx design-system/migrate-tokens.ts --backup

# Migrate specific directory
npx tsx design-system/migrate-tokens.ts --path=./components

# Combine options
npx tsx design-system/migrate-tokens.ts --path=./src --backup --verbose
```

### Script Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without modifying files |
| `--verbose` | Show detailed change logs |
| `--backup` | Create `.backup` files before modifying |
| `--path=<dir>` | Target specific directory (default: current) |

### Reading the Report

After migration, check `design-system/migration-report.json`:

```json
{
  "filePath": "/components/Dashboard.tsx",
  "changes": [
    {
      "line": 45,
      "old": "colors.bg.base",
      "new": "colors.background.primary",
      "type": "typescript"
    }
  ],
  "modified": true
}
```

---

## Component Updates

### GlassCard Component

**Old Props:**
```tsx
<GlassCard variant="medium" glow={true}>
```

**New Props:**
```tsx
<GlassCard intensity="medium" accentBorder={true}>
```

**Prop Mapping:**
- `variant="light"` → `intensity="subtle"`
- `variant="medium"` → `intensity="medium"`
- `variant="heavy"` → `intensity="strong"`
- `glow={true}` → `accentBorder={true}`

---

## Common Patterns

### Pattern 1: Mode-Aware Colors

**Old:**
```typescript
const color = type === 'degen' ? '#ff3366' : '#00d4ff';
```

**New:**
```typescript
// Best: Use utility function
const color = getAccentColor(type, 'primary');

// Or: Direct access
const color = palette[type].primary;
```

### Pattern 2: Glassmorphism Cards

**Old:**
```typescript
<div style={{
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '24px',
  padding: '24px'
}}>
```

**New:**
```typescript
// Best: Use utility class
<div className="glass-medium rounded-2xl p-6">

// Or: Use component
<GlassCard intensity="medium">
  {children}
</GlassCard>

// Or: Import tokens
<div style={{
  backgroundColor: colors.background.glass.medium,
  backdropFilter: `blur(${blur.md})`,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.xl,
  padding: spacing.card.md
}}>
```

### Pattern 3: Gradients

**Old:**
```typescript
background: type === 'degen'
  ? 'linear-gradient(90deg, #ff3366, #ff9500)'
  : 'linear-gradient(90deg, #00d4ff, #00ff88)'
```

**New:**
```typescript
// Best: Use utility function
background: getGradient(type, 'primary')

// Or: Direct access
background: modeColors[type].gradient.primary
```

### Pattern 4: Glowing Effects

**Old:**
```typescript
boxShadow: type === 'degen'
  ? '0 0 40px rgba(255, 51, 102, 0.4)'
  : '0 0 40px rgba(0, 212, 255, 0.4)'
```

**New:**
```typescript
// Best: Use utility function
boxShadow: getGlow(type, 'md')

// Or: Direct access
boxShadow: shadows.glow[type].md
```

### Pattern 5: Responsive Typography

**Old:**
```typescript
fontSize: 'clamp(32px, 5vw, 48px)'
```

**New:**
```typescript
fontSize: typography.fontSize.title
```

---

## Testing

### Visual Regression Checklist

After migration, verify:

- [ ] All colors match design specifications
- [ ] Degen mode displays correct red/orange colors
- [ ] Regen mode displays correct blue/green colors
- [ ] Glassmorphism effects work correctly
- [ ] Borders and shadows render properly
- [ ] Typography scales responsively
- [ ] Gradients animate smoothly
- [ ] Hover/active states function correctly
- [ ] Mode switching works seamlessly
- [ ] No console errors or warnings

### Component Testing

Test each migrated component:

```typescript
import { render } from '@testing-library/react';
import Dashboard from './Dashboard';

test('Dashboard renders with degen mode', () => {
  const { container } = render(<Dashboard type="degen" />);
  // Verify colors, styles, etc.
});

test('Dashboard renders with regen mode', () => {
  const { container } = render(<Dashboard type="regen" />);
  // Verify colors, styles, etc.
});
```

---

## Troubleshooting

### Issue: Import errors after migration

**Problem:**
```
Module not found: Can't resolve '@/styles/tokens/colors'
```

**Solution:**
Update all imports to new design system:
```typescript
import { palette, colors, modeColors } from '@/design-system/tokens';
```

---

### Issue: Colors not matching

**Problem:**
Colors appear different after migration.

**Solution:**
Old colors were consolidated. Check the mapping:
- `#ff3333`, `#ff0000` → `#ff3366` (new Degen primary)
- `#00aaff`, `#3399ff` → `#00d4ff` (new Regen primary)

If intentional variation is needed, use tertiary colors:
```typescript
palette.degen.tertiary  // #ff6b6b (lighter red)
palette.regen.tertiary  // #00aaff (lighter blue)
```

---

### Issue: CSS variables undefined

**Problem:**
CSS variable shows as undefined or not rendering.

**Solution:**
Ensure you're using the correct variable name:

```css
/* Old */
background: var(--bg-base);

/* New */
background: var(--bg-primary);
```

Check `design-system/globals.css` for all available variables.

---

### Issue: Mode switching not working

**Problem:**
Colors don't change when switching between Degen/Regen modes.

**Solution:**
Use mode-aware tokens:

```typescript
// Bad: Hardcoded
color: '#ff3366'

// Good: Mode-aware
color: getAccentColor(mode, 'primary')

// Or in CSS
color: var(--accent-primary)
```

Ensure your component has `data-mode` attribute:
```tsx
<div data-mode={type}>
```

---

### Issue: Glassmorphism not rendering

**Problem:**
Glass effect not visible or incorrect.

**Solution:**
Ensure backdrop-filter is supported and check parent element:

```tsx
// Parent needs to be positioned
<div style={{ position: 'relative' }}>
  <div className="glass-medium">
    Glass content
  </div>
</div>
```

Or use the GlassCard component:
```tsx
<GlassCard intensity="medium">
  Content
</GlassCard>
```

---

## Migration Checklist

Use this checklist for each component:

- [ ] Update imports to new design system
- [ ] Replace old color tokens with new semantic tokens
- [ ] Convert hardcoded colors to token references
- [ ] Update CSS variables to new names
- [ ] Replace old utility classes with new ones
- [ ] Convert inline styles to use tokens
- [ ] Update component props (e.g., GlassCard)
- [ ] Test in both Degen and Regen modes
- [ ] Verify responsive behavior
- [ ] Check accessibility (contrast, focus states)
- [ ] Remove any backup files after verification

---

## Additional Resources

- **Token Reference:** `design-system/tokens.ts`
- **CSS Variables:** `design-system/globals.css`
- **Token Mapping:** `design-system/token-mapping.json`
- **Migration Report:** `design-system/migration-report.json` (after running script)
- **Component Examples:** `design-system/components/`

---

## Support

If you encounter issues not covered in this guide:

1. Check `design-system/token-mapping.json` for complete mappings
2. Review the migration report for specific file changes
3. Consult `design-system/DESIGN-SYSTEM.md` for design philosophy
4. Check component examples in `design-system/components/`

---

**Last Updated:** December 4, 2024  
**Version:** 1.0.0
