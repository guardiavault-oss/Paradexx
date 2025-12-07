# Paradex Design System

## Overview
Paradex uses a custom design system built on Tailwind CSS v4 with a metallic chrome aesthetic that contrasts "Degen" (crimson red #DC143C) and "Regen" (blue/purple) identities.

## Color Tokens

### Primary Colors
- **Degen**: `#DC143C` (Crimson Red) - Used for all degen-themed components
- **Regen**: Purple/Blue gradients - Used for regen-themed components
- **Chrome**: Metallic grays and silver - Base UI elements

### Token System
All design tokens are defined in `/styles/globals.css` using CSS custom properties.

## Components

### UI Components
Located in `/components/ui/`:
- Buttons, inputs, modals, cards
- Toast notifications, tooltips, dropdowns
- Progress bars, skeletons, badges
- Tabs, accordions, dialogs

### Effect Components
Located in `/components/effects/`:
- AnimatedGradientText
- BackgroundBeams
- BentoGrid
- Card3D
- Meteors
- MovingBorder
- Sparkles
- Spotlight

### Layout Components
Located in `/components/layout/`:
- Container, Flex, Stack
- CardGrid, Section
- PageLayout, SidebarLayout

## Design Guidelines

### Typography
- Do not override font-size, font-weight, or line-height classes unless specifically requested
- Default typography is set in `/styles/globals.css`

### Spacing
- Use Tailwind's spacing scale (4px increments)
- Consistent padding: `p-4`, `p-6`, `p-8`
- Consistent gaps: `gap-2`, `gap-4`, `gap-6`

### Glass Effect
- Use `GlassCard` component from `/components/ui/GlassCard.tsx`
- Backdrop blur with transparency
- Subtle borders and shadows

## WebGL Components

### Shader Backgrounds
- **FlowingShaderBackground**: Menger sponge fractal shader
- **TunnelLanding**: 3D tunnel effect with GSAP animations

### Usage
```tsx
import { FlowingShaderBackground } from './components/FlowingShaderBackground';
import TunnelLanding from './components/TunnelLanding';
```

## Best Practices

1. **Consistency**: Always use crimson red (#DC143C) for degen colors
2. **Performance**: Lazy load heavy components (Three.js, WebGL)
3. **Responsiveness**: Mobile-first design approach
4. **Accessibility**: Include aria-labels and keyboard navigation
5. **Animation**: Use motion/react for smooth transitions
