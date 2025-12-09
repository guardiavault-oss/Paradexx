# GuardiaVault Design System Guidelines

## 🎨 Overview
This document outlines the design patterns and guidelines for maintaining consistency across GuardiaVault's UI.

---

## 📏 Spacing Scale

Use Tailwind's default spacing scale consistently:

### Component Spacing
- **Cards**: `p-6` (mobile), `sm:p-8` (tablet+)
- **Sections**: `py-12` (mobile), `sm:py-16` (tablet), `lg:py-24` (desktop)
- **Container**: `px-4` (mobile), `sm:px-6` (tablet), `lg:px-8` (desktop)
- **Grid gaps**: `gap-4` (mobile), `sm:gap-6` (tablet+)
- **Stack spacing**: `space-y-6` for vertical spacing between related elements

### Example Usage
```tsx
// Card component
<div className="p-6 sm:p-8 rounded-2xl">
  <div className="space-y-6">
    {children}
  </div>
</div>

// Section
<section className="py-12 sm:py-16 lg:py-24">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    {/* Content */}
  </div>
</section>
```

---

## 📱 Responsive Breakpoints

Tailwind breakpoints:
- `sm`: 640px (tablet portrait)
- `md`: 768px (tablet landscape)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)
- `2xl`: 1536px (extra large desktop)

### Mobile-First Approach
Always design for mobile first, then enhance for larger screens:

```tsx
// ✅ Good: Mobile first
<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
  Your Crypto, Protected Forever
</h1>

// ❌ Bad: Desktop first
<h1 className="text-7xl lg:text-6xl md:text-5xl sm:text-4xl">
  Your Crypto, Protected Forever
</h1>
```

### Responsive Grid Patterns
```tsx
// Stats Grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
  {/* 1 col mobile, 2 cols tablet, 4 cols desktop */}
</div>

// Content + Sidebar
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">{/* Main content */}</div>
  <div>{/* Sidebar */}</div>
</div>
```

---

## 🎨 Semantic Color System

Use semantic gradient variables for consistency:

### Primary Actions (Yield, Earnings, Positive)
```tsx
<button className="bg-gradient-to-r from-blue-600 to-purple-600">
  Start Earning
</button>
// Or use utility: btn-gradient-primary
```

### Color Variable Reference
- **Primary**: `--gradient-primary` - Blue to cyan (yield, earnings)
- **Secondary**: `--gradient-secondary` - Purple to violet (create, add)
- **Success**: `--gradient-success` - Emerald to green (completed, verified)
- **Warning**: `--gradient-warning` - Orange (pending, check-in due)
- **Danger**: `--gradient-danger` - Red (recover, emergency)
- **Neutral**: `--gradient-neutral` - Gray (settings, info)

---

## 🔘 Button Hierarchy

### Primary CTA (Conversion Actions)
```tsx
<Button
  className="bg-gradient-to-r from-blue-600 to-purple-600
           hover:from-blue-500 hover:to-purple-500
           text-white font-semibold shadow-lg"
>
  Get Started Free
</Button>
```

### Secondary CTA (Less Important)
```tsx
<Button variant="outline">
  Learn More
</Button>
```

### Tertiary CTA (Minimal Emphasis)
```tsx
<button className="text-slate-300 hover:text-white">
  View Details
</button>
```

---

## ♿ Accessibility Standards

### Touch Targets
All interactive elements must meet **44px minimum** touch target size:

```tsx
// ✅ Good: Meets minimum
<button className="min-h-[44px] px-6">Click Me</button>

// ✅ Also good: Auto-applied via global CSS
<button className="px-6">Click Me</button> // touch-target applied automatically

// ❌ Bad: Too small
<button className="h-8 px-2">Click</button>
```

### Color Contrast
- **Small text on dark backgrounds**: Use `text-slate-300` minimum (7:1 contrast)
- **Large text (18px+)**: `text-slate-400` is acceptable (4.5:1 contrast)
- **Interactive elements**: Must have visible focus states

```tsx
// ✅ Good contrast
<p className="text-slate-300">Secondary text</p>

// ❌ Insufficient contrast
<p className="text-slate-400">Secondary text</p> // Only for large text
```

### Keyboard Navigation
```tsx
// Add visible focus states
<button className="focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-primary/50 focus-visible:ring-offset-2
                 focus-visible:ring-offset-slate-900">
  Click Me
</button>
```

---

## 📐 Typography Scale

### Headings
```tsx
<h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1]">
  Hero Headline
</h1>

<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
  Section Title
</h2>

<h3 className="text-xl sm:text-2xl font-semibold">
  Card Title
</h3>
```

### Body Text
```tsx
<p className="text-base sm:text-lg md:text-xl leading-relaxed">
  Main body text
</p>

<p className="text-sm text-slate-400">
  Secondary text / captions
</p>
```

---

## 🎯 Component Patterns

### Cards with Clear Hierarchy
```tsx
// Primary card (important data)
<div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80
               border-2 border-primary/30 rounded-2xl p-6">
  {content}
</div>

// Secondary card (less important)
<div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
  {content}
</div>
```

### Stats Display
```tsx
<div className="space-y-1">
  <div className="text-3xl font-bold text-white">
    $12,345
  </div>
  <div className="text-sm text-slate-400">
    Portfolio Value
  </div>
</div>
```

### Loading States
```tsx
// Skeleton loader
<div className="animate-pulse space-y-4">
  <div className="h-12 bg-slate-700/50 rounded-xl" />
  <div className="h-32 bg-slate-700/50 rounded-xl" />
</div>

// Button loading
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Loading...
    </>
  ) : (
    "Submit"
  )}
</Button>
```

---

## 🚀 Animation Guidelines

### Subtle Animations Only
- **Duration**: 200-300ms for most transitions
- **Easing**: `ease-out` for entrances, `ease-in` for exits
- **Purpose**: Animations should guide attention, not distract

```tsx
// ✅ Good: Subtle hover effect
<button className="transition-all duration-200 hover:scale-105">
  Click Me
</button>

// ❌ Bad: Too much animation
<button className="transition-all duration-1000 hover:rotate-360 hover:scale-150">
  Click Me
</button>
```

### Micro-interactions
```tsx
// Animated shine effect on primary CTA
<button className="relative overflow-hidden group">
  <span className="relative z-10">Start Earning</span>
  <div className="absolute inset-0 bg-gradient-to-r from-transparent
                via-white/20 to-transparent translate-x-[-200%]
                group-hover:translate-x-[200%] transition-transform duration-700" />
</button>
```

---

## 📦 Layout Patterns

### Dashboard Layout
```tsx
<SidebarProvider>
  <EnhancedAppSidebar />
  <SidebarInset>
    <div className="container mx-auto px-6 py-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">{/* Primary content */}</div>
        <div>{/* Sidebar content */}</div>
      </div>
    </div>
  </SidebarInset>
</SidebarProvider>
```

---

## 🎨 Visual Hierarchy Best Practices

1. **Primary information** should be immediately visible
   - Larger text, bolder weights, higher contrast colors
   - Example: Portfolio value, yield earned

2. **Secondary information** should be easily scannable
   - Smaller text, medium weights, lower contrast
   - Example: APY percentage, last updated time

3. **Tertiary information** should be available but not distracting
   - Small text, light weights, muted colors
   - Example: Tooltips, helper text, footnotes

4. **Use whitespace generously**
   - Don't cram too much information in one view
   - Group related items with spacing

5. **Limit decorative elements**
   - Each visual element should serve a purpose
   - Remove gradients, shadows, animations that don't add value

---

## ✅ Before/After Checklist

Before implementing a new component, ask:

- [ ] Does it use semantic color variables?
- [ ] Does it follow the spacing scale?
- [ ] Are touch targets at least 44px?
- [ ] Is the contrast ratio sufficient (7:1 for small text)?
- [ ] Does it work on mobile (320px width)?
- [ ] Is the visual hierarchy clear?
- [ ] Are animations subtle and purposeful?
- [ ] Is the component accessible (keyboard navigation, focus states)?

---

## 📚 Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **shadcn/ui Components**: https://ui.shadcn.com/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Touch Target Guidelines**: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html

---

## 🔄 Continuous Improvement

This design system is a living document. As we identify new patterns or improve existing ones, we update this guide. If you notice inconsistencies or have suggestions, please contribute!

**Last Updated**: November 2025
**Version**: 2.0
