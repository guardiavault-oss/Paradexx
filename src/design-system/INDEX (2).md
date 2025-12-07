# Paradox Wallet Design System - Documentation Index

Quick navigation for all design system documentation and resources.

---

## 🚀 Getting Started

**New to the design system?** Start here:

1. **[README.md](./README.md)** - Quick start guide and overview
2. **[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)** - Complete usage documentation
3. **[MIGRATION-CHECKLIST.md](./MIGRATION-CHECKLIST.md)** - Step-by-step migration guide

---

## 📁 Core Files

### System Implementation

| File | Description | When to Use |
|------|-------------|-------------|
| [tokens.ts](./tokens.ts) | All design tokens (colors, typography, spacing, etc.) | Reference token values, use utility functions |
| [tailwind.config.ts](./tailwind.config.ts) | Tailwind theme configuration | Configure Tailwind, extend utilities |
| [globals.css](./globals.css) | CSS custom properties and utility classes | Use CSS variables, apply utility classes |
| [index.ts](./index.ts) | Main export file | Import design system into your project |
| [components/GlassCard.tsx](./components/GlassCard.tsx) | Glassmorphism components | Build glass-effect UI elements |

### Documentation

| File | Description | When to Use |
|------|-------------|-------------|
| [README.md](./README.md) | Quick start and overview | First-time setup, quick reference |
| [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) | Complete usage guide | Learn API, see examples, understand concepts |
| [MIGRATION-CHECKLIST.md](./MIGRATION-CHECKLIST.md) | Migration guide | Migrating existing code to design system |
| [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) | Project summary | Understand what was built and why |
| [design-system-audit.md](./design-system-audit.md) | Original audit findings | See what problems were solved |

---

## 📖 Documentation by Purpose

### "I want to..."

#### **...get started quickly**
→ [README.md](./README.md) - Quick Start section

#### **...understand all available tokens**
→ [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Color System, Typography, Spacing sections

#### **...see code examples**
→ [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Examples section  
→ [README.md](./README.md) - Usage Patterns section

#### **...migrate existing code**
→ [MIGRATION-CHECKLIST.md](./MIGRATION-CHECKLIST.md) - Full migration guide

#### **...use glassmorphism components**
→ [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Components section  
→ [components/GlassCard.tsx](./components/GlassCard.tsx) - Source code

#### **...understand the color system**
→ [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Color System section  
→ [tokens.ts](./tokens.ts) - Color token definitions

#### **...use mode-aware theming**
→ [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Mode System section

#### **...apply utility classes**
→ [globals.css](./globals.css) - Utility class definitions  
→ [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Utilities section

#### **...see before/after comparisons**
→ [design-system-audit.md](./design-system-audit.md) - Inconsistencies section  
→ [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) - What Was Consolidated section

#### **...understand the project scope**
→ [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) - Executive Summary

---

## 🎨 Quick Reference by Category

### Colors

**Documentation:** [DESIGN-SYSTEM.md - Color System](./DESIGN-SYSTEM.md#color-system)  
**Code:** [tokens.ts - Colors](./tokens.ts)

**Quick Links:**
- Semantic colors (backgrounds, text, borders)
- Mode-specific colors (degen/regen)
- Gradients
- Utility functions (`getAccentColor`, `getGradient`)

### Typography

**Documentation:** [DESIGN-SYSTEM.md - Typography](./DESIGN-SYSTEM.md#typography)  
**Code:** [tokens.ts - Typography](./tokens.ts)

**Quick Links:**
- Font families
- Responsive font sizes
- Font weights
- Letter spacing
- Line heights

### Spacing & Layout

**Documentation:** [DESIGN-SYSTEM.md - Spacing & Layout](./DESIGN-SYSTEM.md#spacing--layout)  
**Code:** [tokens.ts - Spacing](./tokens.ts)

**Quick Links:**
- Spacing scale
- Semantic spacing (buttons, cards, sections)
- Border radius
- Container widths

### Components

**Documentation:** [DESIGN-SYSTEM.md - Components](./DESIGN-SYSTEM.md#components)  
**Code:** [components/GlassCard.tsx](./components/GlassCard.tsx)

**Available Components:**
- `<GlassCard>` - Glassmorphism card
- `<GlassButton>` - Glass-styled button
- `<GlassPanel>` - Sidebar/panel variant

### Utilities

**Documentation:** [DESIGN-SYSTEM.md - Utilities](./DESIGN-SYSTEM.md#utilities)  
**Code:** [globals.css](./globals.css)

**Available Utilities:**
- Glassmorphism classes (`.glass-*`)
- Button classes (`.btn-*`)
- Text effects (`.text-gradient`, `.text-3d-*`)
- Animations (`.animate-*`)

---

## 🔍 Finding Specific Information

### Colors

```
"I need the degen primary color"
→ DESIGN-SYSTEM.md - Color System - Degen Palette
→ tokens.ts - palette.degen.primary (#ff3366)

"How do I get mode-specific accent colors?"
→ DESIGN-SYSTEM.md - Mode System
→ tokens.ts - getAccentColor() function
```

### Typography

```
"What font size should I use for titles?"
→ DESIGN-SYSTEM.md - Typography - Font Sizes
→ typography.fontSize.title or className="text-title"

"How do I use Rajdhani font?"
→ DESIGN-SYSTEM.md - Typography - Font Families
→ typography.fontFamily.primary or className="font-primary"
```

### Spacing

```
"What padding should cards use?"
→ DESIGN-SYSTEM.md - Spacing - Semantic Spacing
→ spacing.card.md (24px) or className="p-6"

"How do I maintain consistent spacing?"
→ DESIGN-SYSTEM.md - Spacing Scale
→ Use spacing[1-16] or Tailwind classes (p-4, mb-6, etc.)
```

### Components

```
"How do I create a glassmorphism card?"
→ DESIGN-SYSTEM.md - Components - GlassCard
→ <GlassCard intensity="medium" padding="md" />

"What are all the GlassCard props?"
→ DESIGN-SYSTEM.md - Components - GlassCard - Props table
→ components/GlassCard.tsx - Type definitions
```

### Migration

```
"How do I migrate my existing code?"
→ MIGRATION-CHECKLIST.md - Start here
→ Follow phase-by-phase checklist

"What color should replace #ff3333?"
→ MIGRATION-CHECKLIST.md - Phase 1: Color Consolidation
→ Replace with palette.degen.primary (#ff3366)
```

---

## 📊 Statistics & Impact

**Want to see the impact?**
→ [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) - Impact Analysis section

**Key Metrics:**
- 83% reduction in unique color values
- 80% reduction in glassmorphism implementations
- 75% reduction in font size variants
- ~50% reduction in inline styles

---

## 🎯 Common Use Cases

### Use Case 1: Building a New Component

**Recommended Reading Order:**
1. [README.md](./README.md) - Quick Start
2. [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Components section for examples
3. [tokens.ts](./tokens.ts) - Reference available tokens

### Use Case 2: Migrating Existing Component

**Recommended Reading Order:**
1. [MIGRATION-CHECKLIST.md](./MIGRATION-CHECKLIST.md) - Full migration guide
2. [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Migration Guide section
3. [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) - Before/After examples

### Use Case 3: Understanding Design Decisions

**Recommended Reading Order:**
1. [design-system-audit.md](./design-system-audit.md) - What problems existed
2. [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) - What was consolidated
3. [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - How to use the solution

### Use Case 4: Contributing to the System

**Recommended Reading Order:**
1. [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Best Practices section
2. [tokens.ts](./tokens.ts) - Understand token structure
3. [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) - Design philosophy

---

## 📱 Mobile Quick Reference

### Most Common Tasks

| Task | Quick Link |
|------|------------|
| Get accent color for mode | `import { getAccentColor } from '@/design-system'` |
| Create glass card | `<GlassCard mode="degen" accent />` |
| Use semantic text color | `className="text-text-secondary"` |
| Apply card padding | `className="p-6"` or `padding: spacing[6]` |
| Get gradient | `import { getGradient } from '@/design-system'` |
| Use glass utility | `className="glass-medium"` |
| Apply primary font | `className="font-primary"` |
| Get border color | `colors.border.subtle` |

---

## 🗂️ File Tree

```
/design-system/
│
├── 📘 Documentation
│   ├── INDEX.md                    ← You are here
│   ├── README.md                   ← Start here for quick setup
│   ├── DESIGN-SYSTEM.md            ← Complete API reference
│   ├── MIGRATION-CHECKLIST.md      ← Migration guide
│   ├── IMPLEMENTATION-SUMMARY.md   ← Project overview
│   └── design-system-audit.md      ← Original audit
│
├── 💻 Core System
│   ├── tokens.ts                   ← All design tokens
│   ├── tailwind.config.ts          ← Tailwind config
│   ├── globals.css                 ← CSS utilities
│   └── index.ts                    ← Main export
│
└── 🧩 Components
    └── components/
        └── GlassCard.tsx           ← Glass components
```

---

## 🔗 External Resources

### Related Documentation
- Tailwind CSS: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs
- React: https://react.dev

### Design Inspiration
- Glassmorphism: https://hype4.academy/tools/glassmorphism-generator
- Color Tools: https://coolors.co

---

## 📞 Getting Help

### Documentation Issues
- Check table of contents in each file
- Use browser search (Cmd/Ctrl + F)
- Reference code examples

### Code Questions
- Review token definitions in `tokens.ts`
- Check component source in `components/`
- See usage examples in documentation

### Migration Help
- Follow `MIGRATION-CHECKLIST.md` step by step
- Compare before/after in `IMPLEMENTATION-SUMMARY.md`
- Reference best practices in `DESIGN-SYSTEM.md`

---

## ✅ Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| INDEX.md | ✅ Complete | Dec 2025 |
| README.md | ✅ Complete | Dec 2025 |
| DESIGN-SYSTEM.md | ✅ Complete | Dec 2025 |
| MIGRATION-CHECKLIST.md | ✅ Complete | Dec 2025 |
| IMPLEMENTATION-SUMMARY.md | ✅ Complete | Dec 2025 |
| design-system-audit.md | ✅ Complete | Dec 2025 |
| tokens.ts | ✅ Complete | Dec 2025 |
| tailwind.config.ts | ✅ Complete | Dec 2025 |
| globals.css | ✅ Complete | Dec 2025 |
| GlassCard.tsx | ✅ Complete | Dec 2025 |

**All documentation is up-to-date and production-ready.**

---

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Maintained By:** Paradox Wallet Team
