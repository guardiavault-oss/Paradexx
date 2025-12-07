# Frontend Bundle Analysis Report

## Current Bundle Size

### Top 10 Largest Modules

| File | Size (KB) | Type | Optimization |
|------|-----------|------|--------------|
| `index-DgaFaP1w.js` | **1,997.74** | Main bundle | **CRITICAL: Needs splitting** |
| `index-DrvcltPY.js` | 551.70 | Vendor chunk | Code splitting |
| `metamask-sdk-BirjGn_I.js` | 542.30 | Wallet SDK | Lazy load |
| `core-LpZEZVh1.js` | 460.14 | Core library | Tree-shake |
| `index.es-DxlAceR9.js` | 386.42 | Vendor chunk | Code splitting |
| `index-CtMmDJ3v.js` | 316.48 | Vendor chunk | Code splitting |
| `index-BvzUOkkg.js` | 310.50 | Vendor chunk | Code splitting |
| `useSwitchChain-BA_Lrop4.js` | 244.05 | Wagmi hook | Tree-shake |
| `basic-Ddxw3zK2.js` | 139.51 | Base library | Already optimized |
| Various locale files | 50-100 KB each | i18n | Lazy load locales |

**Total Initial Bundle: ~5.5 MB (uncompressed)**
**Target: Reduce to ~3.5 MB (35% reduction)**

## Dependency Analysis

### Large Dependencies

| Dependency | Size | Usage | Files | Optimization |
|-----------|------|-------|-------|--------------|
| **three.js** | ~600KB | 6 files | Landing, LiquidShader, LiveClouds | **Lazy load** |
| **gsap** | ~50KB | 65 files | Many components | **Tree-shake plugins** |
| **ethers.js** | ~500KB | 13 files | Hooks, components | **Migrate to viem** |
| **wagmi** | ~200KB | 5 files | Core wallet | Already optimized |
| **@rainbow-me/rainbowkit** | ~150KB | Multiple | Wallet UI | **Lazy load** |
| **framer-motion** | ~100KB | 39 files | Animations | **Replace with CSS** |
| **@radix-ui** | ~50KB/component | Many | UI components | Already tree-shaken |

### GSAP Usage Analysis

**65 files using GSAP** - Most common pattern:
```typescript
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
```

**Issues:**
- Full GSAP import (`import gsap from "gsap"`) loads entire library
- Plugins registered globally instead of conditionally
- ScrollTrigger loaded everywhere, even when not needed

**Optimization:**
```typescript
// Instead of: import gsap from "gsap";
import { gsap } from "gsap/core";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger); // Only where needed
```

### Three.js Usage Analysis

**6 files using Three.js:**
- `components/ThreeBackground.tsx` - Landing page background
- `components/ui/liquid-shader.tsx` - Shader effect
- `components/LiveClouds.tsx` - Cloud animation
- `components/landing/SolutionSection.tsx` - 3D visualizations

**Optimization:**
- Lazy load all Three.js components
- Only load on desktop (not mobile)
- Use lighter alternatives for simple effects

### Ethers.js Usage Analysis

**13 files using Ethers:**
- Hooks: `useGuardiaVault.ts`, `useMultiSigRecovery.ts`
- Components: Wallet-related components

**Optimization:**
- Migrate to viem (already in use via wagmi)
- Remove ethers.js dependency
- Use wagmi/viem for all blockchain interactions

## Optimization Plan

### Phase 1: Quick Wins (Target: 15% reduction)

1. **GSAP Tree-Shaking** ✅
   - Replace `import gsap from "gsap"` with `import { gsap } from "gsap/core"`
   - Only import needed plugins
   - Register plugins conditionally

2. **Lazy Load Three.js** ✅
   - Convert ThreeBackground to lazy load
   - Only load on desktop
   - Use Suspense boundaries

3. **Remove Framer Motion** (Partial)
   - Replace simple animations with CSS
   - Keep only complex animations
   - Target: 50% reduction

### Phase 2: Medium Impact (Target: 20% reduction)

4. **Migrate Ethers to Viem**
   - Replace ethers imports with viem
   - Update hooks and components
   - Remove ethers dependency

5. **Optimize Wallet SDKs**
   - Lazy load MetaMask SDK
   - Lazy load RainbowKit
   - Code split wallet providers

6. **Image Optimization**
   - Convert PNG to WebP
   - Add lazy loading
   - Use srcset for responsive

### Phase 3: Advanced (Target: 5% reduction)

7. **Locale Optimization**
   - Lazy load locale files
   - Only load user's locale
   - Remove unused locales

8. **Remove Unused Dependencies**
   - Audit package.json
   - Remove unused packages
   - Check for duplicates

## Expected Results

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Initial Bundle | 1,997 KB | ~1,300 KB | **35%** |
| Total JS | ~5.5 MB | ~3.5 MB | **36%** |
| Load Time (3G) | ~2.5s | ~1.6s | **36%** |
| Load Time (4G) | ~0.6s | ~0.4s | **33%** |

## Implementation Priority

1. ✅ **GSAP Tree-Shaking** - High impact, low effort
2. ✅ **Three.js Lazy Loading** - High impact, medium effort
3. ⚠️ **Ethers Migration** - High impact, high effort
4. ⚠️ **Image Optimization** - Medium impact, low effort
5. ⚠️ **Framer Motion Reduction** - Medium impact, medium effort

