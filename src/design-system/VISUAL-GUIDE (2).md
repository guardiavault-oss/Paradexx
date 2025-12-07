# Design System Visual Guide

Quick visual reference for common patterns and token usage.

---

## 🎨 Color Palette Reference

### Degen (Fire) Palette

```
Primary Colors:
┌─────────────────────────────────────────┐
│ #ff3366  palette.degen.primary          │  Main brand color
│ #ff9500  palette.degen.secondary        │  Orange accent
│ #ff6b6b  palette.degen.tertiary         │  Light red (hover)
└─────────────────────────────────────────┘

Shadow Colors (for 3D text effects):
┌─────────────────────────────────────────┐
│ #cc0000  palette.degen.dark             │
│ #990000  palette.degen.darker           │
│ #660000  palette.degen.darkest          │
└─────────────────────────────────────────┘
```

### Regen (Ice) Palette

```
Primary Colors:
┌─────────────────────────────────────────┐
│ #00d4ff  palette.regen.primary          │  Main brand color
│ #00ff88  palette.regen.secondary        │  Green accent
│ #00aaff  palette.regen.tertiary         │  Light blue (special)
└─────────────────────────────────────────┘

Shadow Colors (for 3D text effects):
┌─────────────────────────────────────────┐
│ #0066cc  palette.regen.dark             │
│ #004099  palette.regen.darker           │
│ #003366  palette.regen.darkest          │
└─────────────────────────────────────────┘
```

### Neutral Scale

```
White Overlays (from transparent to opaque):
┌────────────────────────────────────────────────────────┐
│ neutral[50]   rgba(255, 255, 255, 0.05)  ░             │
│ neutral[100]  rgba(255, 255, 255, 0.1)   ░░  ← BORDERS │
│ neutral[200]  rgba(255, 255, 255, 0.2)   ░░░           │
│ neutral[300]  rgba(255, 255, 255, 0.3)   ░░░░          │
│ neutral[400]  rgba(255, 255, 255, 0.4)   ░░░░░ ← MUTED │
│ neutral[500]  rgba(255, 255, 255, 0.5)   ░░░░░░        │
│ neutral[600]  rgba(255, 255, 255, 0.6)   ░░░░░░░       │
│ neutral[700]  rgba(255, 255, 255, 0.7)   ░░░░░░░░ ← 2° │
│ neutral[800]  rgba(255, 255, 255, 0.8)   ░░░░░░░░░     │
│ neutral[900]  rgba(255, 255, 255, 0.9)   ░░░░░░░░░░    │
│ white         #ffffff                    ██████████ ← 1°│
└────────────────────────────────────────────────────────┘
```

---

## 📐 Typography Scale

### Font Sizes (Responsive with clamp)

```
Hero Text
████████████████████████  clamp(48px → 120px)
fontSize.hero

Title Text
███████████████  clamp(32px → 48px)
fontSize.title

Heading Text
████████  clamp(24px → 42px)
fontSize.heading

Subheading Text
██████  clamp(20px → 28px)
fontSize.subheading

Body Text
████  clamp(14px → 18px)
fontSize.body

Small Text
███  clamp(12px → 14px)
fontSize.small
```

### Font Weights

```
Black (900)     ████████████  Main titles, ultra bold
Extrabold (800) ██████████    Section headers
Bold (700)      ████████      UI elements, buttons
Semibold (600)  ██████        Emphasis
Medium (500)    ████          Body variants
Normal (400)    ██            Default text
```

### Letter Spacing

```
Tighter (-0.02em)  ◄──►  Very tight (large titles)
Tight (-0.01em)    ◄───►  Tight
Normal (0em)       ◄────►  Default
Wide (0.05em)      ◄─────►  Slightly spaced
Wider (0.1em)      ◄──────►  More spaced
Widest (0.2em)     ◄────────►  UPPERCASE (most common)
```

---

## 📏 Spacing Scale

### Base 4px Grid

```
spacing[1]   4px    ▌
spacing[2]   8px    ▌▌
spacing[3]   12px   ▌▌▌
spacing[4]   16px   ▌▌▌▌
spacing[5]   20px   ▌▌▌▌▌
spacing[6]   24px   ▌▌▌▌▌▌  ← CARD PADDING (most common)
spacing[8]   32px   ▌▌▌▌▌▌▌▌
spacing[10]  40px   ▌▌▌▌▌▌▌▌▌▌
spacing[12]  48px   ▌▌▌▌▌▌▌▌▌▌▌▌  ← SECTION SPACING
spacing[16]  64px   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌
```

### Common Patterns

```
Button Padding:
┌──────────────────┐
│ ▌▌▌  Text  ▌▌▌▌▌▌▌▌  │  btn.md: 12px 16px
└──────────────────┘

Card Padding:
┌────────────────────────┐
│ ▌▌▌▌▌▌                 │
│ ▌▌▌▌▌▌  Content        │  card.md: 24px
│ ▌▌▌▌▌▌                 │
└────────────────────────┘
```

---

## 🔲 Border Radius Scale

```
sm       8px    ┌──────┐  Small elements
                └──────┘

md       12px   ┌───────┐  Medium elements
                └───────┘

lg       16px   ┌────────┐  Large elements
                └────────┘

xl       24px   ┌──────────┐  Cards (most common)
                └──────────┘

2xl      32px   ┌────────────┐  Extra large
                └────────────┘

3xl      40px   ┌──────────────┐  Tunnel cards
                └──────────────┘

full     ∞      (  Button  )  Circular/pills
```

---

## 🎭 Glassmorphism Patterns

### Subtle Glass

```
┌────────────────────────────────┐
│░░                              │
│░░  backgroundColor:            │
│░░  rgba(0, 0, 0, 0.4)         │
│░░                              │
│░░  backdropFilter:             │
│░░  blur(20px)                  │
│░░                              │
│░░  border: 1px solid           │
│░░  rgba(255, 255, 255, 0.1)   │
│░░                              │
└────────────────────────────────┘
Light blur, minimal background
```

### Medium Glass (Most Common)

```
┌────────────────────────────────┐
│▒▒▒                             │
│▒▒▒  backgroundColor:           │
│▒▒▒  rgba(0, 0, 0, 0.6)        │
│▒▒▒                             │
│▒▒▒  backdropFilter:            │
│▒▒▒  blur(20px)                 │
│▒▒▒                             │
│▒▒▒  border: 1px solid          │
│▒▒▒  rgba(255, 255, 255, 0.1)  │
│▒▒▒                             │
└────────────────────────────────┘
Standard glassmorphism effect
```

### Strong Glass

```
┌────────────────────────────────┐
│████                            │
│████  backgroundColor:          │
│████  rgba(0, 0, 0, 0.8)       │
│████                            │
│████  backdropFilter:           │
│████  blur(40px)                │
│████                            │
│████  border: 1px solid         │
│████  rgba(255, 255, 255, 0.2) │
│████                            │
└────────────────────────────────┘
Heavy background, strong blur
```

---

## 💫 Shadow & Glow Effects

### Standard Shadows

```
Small
┌──────────┐
│          │  0 10px 30px rgba(0, 0, 0, 0.3)
│   Card   │
│          │
└──────────┘
    ▒▒▒▒

Medium
┌──────────┐
│          │  0 20px 60px rgba(0, 0, 0, 0.5)
│   Card   │
│          │
└──────────┘
   ▒▒▒▒▒▒▒

Large
┌──────────┐
│          │  0 20px 60px rgba(0, 0, 0, 0.9)
│   Card   │
│          │
└──────────┘
  ▒▒▒▒▒▒▒▒▒
```

### Glow Shadows (Degen - Red)

```
Subtle
┌──────────┐
│          │
│   Card   │  0 0 20px rgba(255, 51, 102, 0.2)
│          │
└──────────┘
   ◌◌◌◌◌◌

Medium
┌──────────┐
│          │
│   Card   │  0 0 40px rgba(255, 51, 102, 0.4)
│          │
└──────────┘
  ◌◌◌◌◌◌◌◌

Strong
┌──────────┐
│          │
│   Card   │  0 0 60px rgba(255, 51, 102, 0.8)
│          │
└──────────┘
 ◌◌◌◌◌◌◌◌◌◌
```

### Glow Shadows (Regen - Blue)

```
Similar pattern but with rgba(0, 212, 255, *)
```

---

## 🎯 Common Component Patterns

### GlassCard - Default

```
┌────────────────────────────────┐
│▒▒▒ padding: 24px               │
│▒▒▒                             │
│▒▒▒  <GlassCard                 │
│▒▒▒    intensity="medium"       │
│▒▒▒    padding="md"             │
│▒▒▒    rounded="xl"             │
│▒▒▒  >                          │
│▒▒▒    {content}                │
│▒▒▒  </GlassCard>               │
│▒▒▒                             │
└────────────────────────────────┘
borderRadius: 24px
border: 1px solid rgba(255,255,255,0.1)
```

### GlassCard - With Accent (Degen)

```
┌────────────────────────────────┐ ← Red border
│▒▒▒ padding: 24px               │   rgba(255,51,102,0.4)
│▒▒▒                             │
│▒▒▒  <GlassCard                 │
│▒▒▒    mode="degen"             │
│▒▒▒    accent                   │
│▒▒▒    glow                     │   Red glow shadow
│▒▒▒  >                          │   ◌◌◌◌◌◌◌◌◌
│▒▒▒    {content}                │
│▒▒▒  </GlassCard>               │
│▒▒▒                             │
└────────────────────────────────┘
```

### Button - Primary (Degen)

```
┌──────────────────┐
│                  │
│  PRIMARY ACTION  │  background: #ff3366
│                  │  boxShadow: 0 0 40px rgba(255,51,102,0.4)
└──────────────────┘  borderRadius: 9999px
   ◌◌◌◌◌◌◌◌◌◌         padding: 12px 32px
```

### Button - Secondary (Regen)

```
┌──────────────────┐
│                  │
│ SECONDARY ACTION │  background: transparent
│                  │  border: 2px solid #00d4ff
└──────────────────┘  color: #00d4ff
                      borderRadius: 9999px
```

---

## 🎨 Mode-Aware Color Examples

### Degen Mode (Fire)

```
Text on Dark Background:
████████████████████
█ DEGEN MODE TITLE █  ← #ffffff (white)
████████████████████
       🔥🔥🔥

Accent Elements:
┌────────────┐
│ [Button]   │  ← background: #ff3366
└────────────┘
    ◌◌◌◌◌◌

Borders:
─────────────  ← rgba(255, 51, 102, 0.4)

Progress Bar:
▓▓▓▓▓▓░░░░  ← gradient(#ff3366, #ff9500)
```

### Regen Mode (Ice)

```
Text on Dark Background:
████████████████████
█ REGEN MODE TITLE █  ← #ffffff (white)
████████████████████
       ❄️❄️❄️

Accent Elements:
┌────────────┐
│ [Button]   │  ← background: #00d4ff
└────────────┘
    ◌◌◌◌◌◌

Borders:
─────────────  ← rgba(0, 212, 255, 0.4)

Progress Bar:
▓▓▓▓▓▓░░░░  ← gradient(#00d4ff, #00ff88)
```

---

## 📱 Responsive Typography

### How clamp() Works

```
fontSize: clamp(32px, 5vw, 48px)
                │    │    │
                │    │    └─ Maximum: 48px (desktop)
                │    └────── Preferred: 5% of viewport
                └─────────── Minimum: 32px (mobile)

Mobile (375px wide):    32px (minimum)
Tablet (768px wide):    38.4px (5% of 768)
Desktop (1920px wide):  48px (maximum, capped)
```

### Visual Scale

```
Mobile          Tablet          Desktop
(375px)         (768px)         (1920px)

███████         ██████████      ███████████████
32px            38px            48px
(minimum)       (calculated)    (maximum)
```

---

## 🎭 Complete Component Example

### Feature Card - Degen Mode

```
┌────────────────────────────────────────────┐ ← Red glow
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│   ◌◌◌◌◌◌◌
│▒▒▒                                       ▒▒▒│
│▒▒▒  FEATURE                              ▒▒▒│ ← Small label
│▒▒▒  ─────────                            ▒▒▒│   (tracking-widest)
│▒▒▒                                       ▒▒▒│
│▒▒▒  AMAZING TITLE                        ▒▒▒│ ← Large title
│▒▒▒  (font-black, text-heading)           ▒▒▒│   (#ffffff)
│▒▒▒                                       ▒▒▒│
│▒▒▒  Description text with secondary      ▒▒▒│ ← Body text
│▒▒▒  color for better hierarchy and       ▒▒▒│   (text-secondary)
│▒▒▒  readability on dark backgrounds.     ▒▒▒│   rgba(255,255,255,0.7)
│▒▒▒                                       ▒▒▒│
│▒▒▒  ┌──────────────┐  ┌──────────────┐  ▒▒▒│
│▒▒▒  │ PRIMARY BTN  │  │ SECONDARY    │  ▒▒▒│ ← Buttons
│▒▒▒  └──────────────┘  └──────────────┘  ▒▒▒│   (gap: spacing[3])
│▒▒▒  ◌◌◌◌◌◌◌◌◌◌                          ▒▒▒│
│▒▒▒                                       ▒▒▒│
└────────────────────────────────────────────┘
 └─ padding: 24px (spacing[6])
 └─ borderRadius: 24px (radius.xl)
 └─ border: 1px solid rgba(255, 51, 102, 0.4)
```

### Code for Above Example

```tsx
<GlassCard
  mode="degen"
  intensity="medium"
  accent
  glow
  padding="lg"
  rounded="xl"
>
  <span className="text-small tracking-widest uppercase text-text-muted">
    FEATURE
  </span>
  
  <h2 className="font-primary font-black text-heading tracking-wide uppercase mb-4">
    Amazing Title
  </h2>
  
  <p className="text-body text-text-secondary leading-relaxed mb-6">
    Description text with secondary color for better hierarchy and
    readability on dark backgrounds.
  </p>
  
  <div style={{ display: 'flex', gap: spacing[3] }}>
    <GlassButton mode="degen" variant="primary">
      Primary Btn
    </GlassButton>
    <GlassButton mode="degen" variant="secondary">
      Secondary
    </GlassButton>
  </div>
</GlassCard>
```

---

## 🔄 Before & After Comparison

### Before Design System

```typescript
// Inconsistent values everywhere
const color1 = "#ff3333";
const color2 = "#ff3366";
const color3 = "#ff0000";
// ❌ Which one is "correct"?

style={{
  backgroundColor: "rgba(0, 0, 0, 0.73)",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  padding: "23px",
  borderRadius: "26px",
}}
// ❌ Magic numbers, inconsistent
```

### After Design System

```typescript
// Single source of truth
import { palette, getAccentColor } from '@/design-system';
const color = palette.degen.primary;  // #ff3366
// ✅ One canonical value

<GlassCard intensity="medium" padding="md" rounded="xl">
  {/* Standard pattern, reusable */}
</GlassCard>
// ✅ Semantic, consistent
```

---

## 📊 Usage Decision Tree

```
Need a color?
│
├─ Brand color?
│  └─ Use: getAccentColor(mode, 'primary')
│
├─ Text color?
│  ├─ Primary text? → colors.text.primary
│  ├─ Secondary text? → colors.text.secondary
│  └─ Muted text? → colors.text.muted
│
├─ Background?
│  ├─ Main app → colors.background.primary
│  ├─ Cards → colors.background.secondary
│  └─ Glass → Use GlassCard component
│
└─ Border?
   ├─ Subtle → colors.border.subtle (most common)
   ├─ Normal → colors.border.normal
   └─ Accent → modeColors[mode].border.normal

Need spacing?
│
├─ Padding?
│  ├─ Button → spacing.button.md or p-3
│  ├─ Card → spacing.card.md or p-6
│  └─ Section → spacing.section.md or py-12
│
├─ Margin?
│  └─ Use spacing scale: mb-4, mt-6, etc.
│
└─ Gap?
   └─ Use spacing scale: gap-2, gap-4, etc.

Need glassmorphism?
│
├─ Standard card?
│  └─ Use: <GlassCard />
│
├─ Button?
│  └─ Use: <GlassButton />
│
└─ Custom?
   └─ Use: className="glass-medium"
```

---

## 🎯 Quick Token Lookup

### Most Common Values

| What You Need | Token | Tailwind | Value |
|---------------|-------|----------|-------|
| Card padding | `spacing[6]` | `p-6` | 24px |
| Card border radius | `radius.xl` | `rounded-xl` | 24px |
| Subtle border | `colors.border.subtle` | `border-border-subtle` | rgba(255,255,255,0.1) |
| Primary text | `colors.text.primary` | `text-text-primary` | #ffffff |
| Secondary text | `colors.text.secondary` | `text-text-secondary` | rgba(255,255,255,0.7) |
| Glass background | N/A | `glass-medium` | rgba(0,0,0,0.6) + blur(20px) |
| Standard blur | `blur.md` | `backdrop-blur-md` | 20px |
| Button padding | `spacing.button.md` | `px-8 py-3` | 12px 16px |
| Title size | `typography.fontSize.title` | `text-title` | clamp(32px,5vw,48px) |
| Uppercase spacing | `typography.letterSpacing.widest` | `tracking-widest` | 0.2em |

---

**This visual guide provides quick visual reference for common patterns.**  
**For complete documentation, see [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)**

---

**Version:** 1.0.0  
**Last Updated:** December 2025
