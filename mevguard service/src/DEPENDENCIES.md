# MEVGUARD - Required Dependencies

## Installation Instructions

To run the MEVGUARD landing page with all advanced effects, you need to install the following dependencies:

### Required Packages

```bash
npm install gsap three
```

or

```bash
yarn add gsap three
```

or

```bash
pnpm add gsap three
```

## Package Details

### 1. **GSAP (GreenSock Animation Platform)**
- **Version**: Latest (v3.x recommended)
- **Usage**: Advanced scroll-triggered animations, parallax effects, stagger animations
- **Features Used**:
  - ScrollTrigger plugin
  - Smooth scroll animations
  - Stagger effects
  - Parallax scrolling
  - Scale and opacity transitions

### 2. **Three.js**
- **Version**: Latest (v0.160.x recommended)
- **Usage**: 3D particle background effect
- **Features Used**:
  - WebGL renderer
  - Particle systems
  - BufferGeometry
  - Point materials
  - Animation loops
  - Mouse parallax tracking

## Import Syntax

The landing page uses standard ES6 imports:

```typescript
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
```

## Browser Compatibility

- **GSAP**: Works on all modern browsers (IE11+ with polyfills)
- **Three.js**: Requires WebGL support (all modern browsers)
- Mobile devices are fully supported with optimized performance

## Performance Notes

- The particle count is optimized for performance (1000 particles)
- `setPixelRatio` is limited to `Math.min(window.devicePixelRatio, 2)` for better performance on high-DPI displays
- Animation frame cleanup is properly handled on component unmount
- Scroll animations use GSAP's optimized engine for 60fps performance

## Troubleshooting

If you encounter issues:

1. **GSAP ScrollTrigger not working**: Make sure you register the plugin:
   ```typescript
   gsap.registerPlugin(ScrollTrigger);
   ```

2. **Three.js not rendering**: Check browser console for WebGL support errors

3. **Performance issues**: Reduce particle count in `LandingPage.tsx` (line ~60)

## Additional Features Already Installed

The dashboard already includes these packages which are used by the landing page:
- `lucide-react` (icons)
- `motion/react` (additional animations)
- `tailwindcss` (styling)
- ShadCN UI components

## Total Landing Page Features

✅ **Three.js 3D Particle Background** - Animated particle system with connecting lines
✅ **GSAP ScrollTrigger Animations** - Scroll-based reveals and transitions
✅ **Parallax Scrolling** - Multi-layer depth effects
✅ **Gradient Animations** - Animated gradient overlays
✅ **Hover Effects** - Scale transitions on cards and buttons
✅ **Stagger Animations** - Sequential element reveals
✅ **Mouse Tracking** - Camera follows mouse movement
✅ **Smooth Scrolling** - Buttery smooth page scrolling
✅ **Responsive Design** - Mobile-first, fully responsive
✅ **Performance Optimized** - 60fps animations, proper cleanup
