# 🎨 Animation Setup Guide for GuardiaVault-2

## ✅ Files Already Created:
- `client/src/components/ThreeBackground.tsx` - 3D particle background
- `client/src/hooks/useGsapScroll.ts` - GSAP animation hooks
- `client/src/hooks/useTextReveal.tsx` - Text reveal animations  
- `client/src/styles/animations.css` - CSS animations
- `client/src/pages/Landing.tsx` - Updated with animation classes

## 📦 Required Packages (MUST INSTALL):

```bash
cd client
npm install gsap three @types/three
```

## 🎯 Animation Features Included:

### 1. **Three.js 3D Background**
- 3000 animated particles
- 8 floating geometric shapes
- Dynamic colored lighting
- Mouse parallax interaction

### 2. **GSAP Scroll Animations**
- `useFadeInUp()` - Fade and slide up
- `useScaleIn()` - Scale animations
- `useParallax()` - Parallax depth effect
- `useStaggerChildren()` - Sequential animations

### 3. **Text Reveal**
- Word-by-word reveal on scroll
- Add `.reveal-text` class to headings

### 4. **CSS Animation Classes**
- `.fade-in` - Fade in on scroll
- `.scale-in` - Scale up on scroll
- `.skew-scroll` - Skew on scroll velocity
- `.parallax-section` - Parallax container
- `.counter` - Number counting animation
- `.magnetic` - Magnetic button hover
- `.gradient-text` - Animated gradient
- `.glitch` - Glitch effect
- `.float-animation` - Floating motion

## 🚀 Usage in Components:

### Option 1: Using Hooks
```tsx
import { useFadeInUp, useScaleIn } from "@/hooks/useGsapScroll";

function MyComponent() {
  const fadeRef = useFadeInUp(0.2);
  const scaleRef = useScaleIn();
  
  return (
    <>
      <div ref={fadeRef}>Fades in</div>
      <div ref={scaleRef}>Scales in</div>
    </>
  );
}
```

### Option 2: Using CSS Classes
```tsx
<div className="section-animate fade-in">
  <h2 className="reveal-text">This text reveals word by word</h2>
</div>
```

### Option 3: Counter Animation
```tsx
<span className="counter" data-value="1000">0</span>
```

## 🎨 Current Landing Page Structure:

```
Landing.tsx:
├── ThreeBackground (3D particles)
├── Hero (parallax-section)
├── Problem (fade-in)
├── Solution (fade-in)
├── How It Works (skew-scroll)
├── Features (scale-in)
├── Pricing (fade-in)
├── FAQ (fade-in)
└── Marquee (scrolling features)
```

## ⚠️ Important Notes:

1. **Install packages first** or you'll get import errors
2. Three.js background is GPU-intensive - test performance
3. Animations work best with `overflow-x: hidden` on body
4. Text reveal needs `.reveal-text` class on elements
5. Counter animations need `data-value` attribute

## 🔧 Troubleshooting:

### Animations not showing?
1. Check if packages are installed: `npm list gsap three`
2. Verify animations.css is imported in Landing.tsx
3. Check browser console for errors

### Performance issues?
1. Reduce particle count in ThreeBackground.tsx (line 58)
2. Disable Three.js background temporarily
3. Reduce animation duration/stagger values

### Text not revealing?
1. Add `.reveal-text` class to heading
2. Wrap in `.reveal-section` if needed
3. Call `useTextReveal()` in component

## 📱 Browser Support:

- Chrome 90+ ✅
- Firefox 88+ ✅  
- Safari 14+ ✅
- Edge 90+ ✅
- Mobile browsers ✅ (reduced effects)

---

**After installing packages, restart your dev server!**

```bash
pnpm run dev
```
