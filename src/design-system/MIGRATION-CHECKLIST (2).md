# Design System Migration Checklist

Use this checklist to migrate existing Paradox Wallet code to the new design system.

## 📋 Pre-Migration

- [ ] Review `DESIGN-SYSTEM.md` documentation
- [ ] Understand semantic naming conventions
- [ ] Familiarize yourself with utility functions (`getAccentColor`, `getGradient`, etc.)
- [ ] Review component API (`GlassCard`, `GlassButton`)

---

## 🎨 Phase 1: Color Consolidation

### Replace Inconsistent Primary Colors

- [ ] Replace all `#ff3333` → `palette.degen.primary` or `#ff3366`
- [ ] Replace all `#ff0000` → `palette.degen.primary` or `#ff3366`
- [ ] Replace all `#3399ff` → `palette.regen.primary` or `#00d4ff`
- [ ] Replace all `#00aaff` → `palette.regen.primary` or `#00d4ff`
- [ ] Replace all `#0066ff` → `palette.regen.primary` or `#00d4ff`

### Update Mode-Aware Color Logic

Replace this pattern:
```typescript
const primaryColor = isDegen ? "#ff3333" : "#3399ff";
```

With:
```typescript
import { getAccentColor } from '@/design-system';
const primaryColor = getAccentColor(isDegen ? 'degen' : 'regen', 'primary');
```

**Files to check:**
- [ ] `/App.tsx`
- [ ] `/components/Dashboard.tsx`
- [ ] `/components/WalletEntry.tsx`
- [ ] `/components/GlassOnboarding.tsx`
- [ ] `/components/TunnelLanding.tsx`
- [ ] `/components/landing/Assessment.tsx`
- [ ] `/components/landing/LandingPage.tsx`

### Replace RGBA Color Variations

- [ ] `rgba(255, 51, 102, ...)` → Use `modeColors.degen.*` variants
- [ ] `rgba(255, 50, 50, ...)` → Use `modeColors.degen.*` variants
- [ ] `rgba(255, 100, 100, ...)` → Use `modeColors.degen.*` variants
- [ ] `rgba(0, 212, 255, ...)` → Use `modeColors.regen.*` variants
- [ ] `rgba(0, 150, 255, ...)` → Use `modeColors.regen.*` variants
- [ ] `rgba(100, 150, 255, ...)` → Use `modeColors.regen.*` variants

### Replace Neutral Colors

- [ ] `#ffffff` → `colors.text.primary` or `palette.white`
- [ ] `rgba(255, 255, 255, 0.7)` → `colors.text.secondary`
- [ ] `rgba(255, 255, 255, 0.6)` → `colors.text.tertiary`
- [ ] `rgba(255, 255, 255, 0.4)` → `colors.text.muted`
- [ ] `rgba(255, 255, 255, 0.1)` → `colors.border.subtle`
- [ ] `rgba(0, 0, 0, 0.95)` → `colors.background.primary`
- [ ] `rgba(0, 0, 0, 0.8)` → `colors.background.secondary`

---

## 🔤 Phase 2: Typography Updates

### Replace Font Family

Replace:
```typescript
fontFamily: "'Rajdhani', sans-serif"
```

With:
```typescript
// Option 1: Token
fontFamily: typography.fontFamily.primary

// Option 2: Tailwind
className="font-primary"
```

**Files to update:**
- [ ] All files using `'Rajdhani', sans-serif`

### Replace Font Sizes

Replace fixed sizes with responsive clamp:

```typescript
// Before
fontSize: "48px"

// After - Option 1: Token
fontSize: typography.fontSize.title

// After - Option 2: Tailwind
className="text-title"
```

**Size mapping:**
- [ ] `48px-120px` → `typography.fontSize.hero` or `text-hero`
- [ ] `32px-48px` → `typography.fontSize.title` or `text-title`
- [ ] `24px-42px` → `typography.fontSize.heading` or `text-heading`
- [ ] `14px-18px` → `typography.fontSize.body` or `text-body`
- [ ] `12px-14px` → `typography.fontSize.small` or `text-small`

### Standardize Letter Spacing

Replace:
```typescript
letterSpacing: "0.2em"  // Most common for uppercase
```

With:
```typescript
letterSpacing: typography.letterSpacing.widest
// or
className="tracking-widest"
```

---

## 📏 Phase 3: Spacing & Layout

### Replace Padding Values

```typescript
// Before
padding: "24px"

// After
padding: spacing[6]
// or
className="p-6"
```

**Common conversions:**
- [ ] `16px` → `spacing[4]` or `p-4`
- [ ] `24px` → `spacing[6]` or `p-6` (most common for cards)
- [ ] `32px` → `spacing[8]` or `p-8`
- [ ] `48px` → `spacing[12]` or `p-12`

### Replace Border Radius

```typescript
// Before
borderRadius: "24px"

// After
borderRadius: radius.xl
// or
className="rounded-xl"
```

**Common conversions:**
- [ ] `8px` → `radius.sm` or `rounded-sm`
- [ ] `12px` → `radius.md` or `rounded-md`
- [ ] `16px` → `radius.lg` or `rounded-lg`
- [ ] `24px` → `radius.xl` or `rounded-xl` (most common)
- [ ] `32px` → `radius['2xl']` or `rounded-2xl`
- [ ] `9999px` → `radius.full` or `rounded-full`

---

## 🎭 Phase 4: Glassmorphism Components

### Identify Glass Patterns

Find all instances of this pattern:
```typescript
backgroundColor: "rgba(0, 0, 0, 0.4-0.8)"
backdropFilter: "blur(20px)"
border: "1px solid rgba(255, 255, 255, 0.1)"
```

### Replace with GlassCard Component

```tsx
// Before
<div style={{
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "24px",
  padding: "24px",
}}>
  {content}
</div>

// After
import { GlassCard } from '@/design-system';

<GlassCard intensity="medium" padding="md" rounded="xl">
  {content}
</GlassCard>
```

**Files with glass patterns:**
- [ ] `/components/Dashboard.tsx`
- [ ] `/components/GlassOnboarding.tsx`
- [ ] `/components/TunnelCard.tsx`
- [ ] `/components/SettingsModal.tsx`
- [ ] `/components/landing/Assessment.tsx`

### Replace with Utility Classes

For simple cases:
```tsx
// Before
style={{
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
}}

// After
className="glass-medium"
```

---

## 🔘 Phase 5: Button Standardization

### Replace Button Styles

```tsx
// Before
<button style={{
  backgroundColor: isDegen ? "#ff3366" : "#00d4ff",
  color: "#ffffff",
  padding: "12px 32px",
  borderRadius: "9999px",
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
}}>

// After
import { GlassButton } from '@/design-system';

<GlassButton mode={isDegen ? 'degen' : 'regen'} variant="primary" size="md">
```

### Button Variant Mapping

- [ ] Primary (solid background) → `variant="primary"`
- [ ] Secondary (transparent + border) → `variant="secondary"`
- [ ] Ghost (subtle background) → `variant="ghost"`

**Files with custom buttons:**
- [ ] All components with inline button styles

---

## 🎨 Phase 6: Effects & Shadows

### Replace Box Shadows

```typescript
// Before
boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)"

// After
boxShadow: shadows.md
```

### Replace Glow Shadows

```typescript
// Before
boxShadow: isDegen 
  ? "0 0 40px rgba(255, 51, 102, 0.4)"
  : "0 0 40px rgba(0, 212, 255, 0.4)"

// After
import { getGlow } from '@/design-system';
boxShadow: getGlow(isDegen ? 'degen' : 'regen', 'md')
```

### Replace Backdrop Blur

```typescript
// Before
backdropFilter: "blur(20px)"

// After
backdropFilter: `blur(${blur.md})`
// or
className="backdrop-blur-md"
```

---

## 📱 Phase 7: Responsive Updates

### Use Clamp for Responsive Text

```tsx
// Before
<h1 style={{
  fontSize: window.innerWidth < 768 ? "32px" : "48px"
}}>

// After
<h1 className="text-title">
  {/* Auto-scales from 32px to 48px */}
```

### Mobile-First Classes

Use Tailwind responsive prefixes:
```tsx
<div className="p-4 md:p-6 lg:p-8">
  {/* 16px on mobile, 24px on tablet, 32px on desktop */}
</div>
```

---

## ✅ Phase 8: Testing & Validation

### Visual Regression Testing

For each migrated component:
- [ ] Compare before/after screenshots
- [ ] Verify colors match exactly
- [ ] Check spacing is consistent
- [ ] Ensure glassmorphism looks identical
- [ ] Test hover states
- [ ] Test both degen and regen modes

### Code Review Checklist

- [ ] No hardcoded color values (`#ff3366`)
- [ ] No magic numbers for spacing (`23px`)
- [ ] Consistent use of design tokens
- [ ] Components used where applicable
- [ ] Tailwind classes used for common patterns
- [ ] Mode-aware colors working correctly

### Performance Check

- [ ] Bundle size unchanged or smaller
- [ ] No duplicate styles in CSS
- [ ] Utility classes generating efficiently
- [ ] No unnecessary re-renders

---

## 📊 Phase 9: Documentation Updates

### Update Component Comments

Add design system references:
```typescript
/**
 * UserCard Component
 * Uses design system tokens for consistent styling
 * @see /design-system/DESIGN-SYSTEM.md
 */
```

### Update Storybook/Examples

- [ ] Update component examples to use design system
- [ ] Add new examples showing token usage
- [ ] Document migration patterns

---

## 🔄 Phase 10: Cleanup

### Remove Old Patterns

- [ ] Delete custom glassmorphism implementations
- [ ] Remove duplicate color definitions
- [ ] Clean up unused inline styles
- [ ] Remove commented-out old code

### Consolidate Imports

```typescript
// Before - Multiple imports
import colors from './colors';
import typography from './typography';
import spacing from './spacing';

// After - Single import
import { colors, typography, spacing } from '@/design-system';
```

---

## 📝 Migration Progress Tracker

### By File

Track migration status for each file:

- [ ] `/App.tsx`
- [ ] `/components/Dashboard.tsx`
- [ ] `/components/WalletEntry.tsx`
- [ ] `/components/GlassOnboarding.tsx`
- [ ] `/components/TunnelLanding.tsx`
- [ ] `/components/TunnelCard.tsx`
- [ ] `/components/SettingsModal.tsx`
- [ ] `/components/landing/Assessment.tsx`
- [ ] `/components/landing/LandingPage.tsx`
- [ ] `/components/ui/*` (all UI components)

### By Category

Track completion percentage:

- [ ] Colors: ___%
- [ ] Typography: ___%
- [ ] Spacing: ___%
- [ ] Components: ___%
- [ ] Effects: ___%

---

## 🎯 Success Criteria

Migration is complete when:

- [ ] ✅ All color inconsistencies resolved (no #ff3333, #3399ff, etc.)
- [ ] ✅ All glassmorphism uses components or utilities
- [ ] ✅ All typography uses design system fonts/sizes
- [ ] ✅ All spacing follows token system
- [ ] ✅ Visual regression tests pass
- [ ] ✅ No hardcoded magic values
- [ ] ✅ Bundle size same or smaller
- [ ] ✅ Code is more maintainable

---

## 💡 Tips

1. **Migrate incrementally** - One component at a time
2. **Test frequently** - Check visual changes after each migration
3. **Use components first** - Then utility classes, then tokens
4. **Keep screenshots** - Compare before/after
5. **Ask for help** - Reference `DESIGN-SYSTEM.md` for examples

---

**Last Updated:** December 2025  
**Version:** 1.0.0
