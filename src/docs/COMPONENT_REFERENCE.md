# Component Reference

## Core Components

### SplashScreen
**Location**: `/components/SplashScreen.tsx`

Initial loading screen with logo and water drop ripple effect.

```tsx
import { SplashScreen } from './components/SplashScreen';

<SplashScreen onComplete={() => setShowSplash(false)} />
```

**Props**:
- `onComplete: () => void` - Callback when animation completes (2s)
- `type?: 'degen' | 'regen'` - Theme variant (default: 'degen')

---

### WalletEntry
**Location**: `/components/WalletEntry.tsx`

Entry point for wallet connection with chrome metallic design.

```tsx
import WalletEntry from './components/WalletEntry';

<WalletEntry 
  onWalletConnected={(address) => handleConnect(address)}
  onBack={() => goBack()}
/>
```

---

### GlassOnboarding
**Location**: `/components/GlassOnboarding.tsx`

Onboarding flow with Standard and Advanced setup options.

```tsx
import GlassOnboarding from './components/GlassOnboarding';

<GlassOnboarding 
  onComplete={() => setShowOnboarding(false)}
/>
```

**Features**:
- Standard vs Advanced setup paths
- Blue highlight on Advanced option
- Glass morphism cards
- Clipboard functionality for recovery phrases

---

### TribeOnboarding
**Location**: `/components/TribeOnboarding.tsx`

Dual identity selection: Degen (crimson) or Regen (purple/blue).

```tsx
import TribeOnboarding from './components/TribeOnboarding';

<TribeOnboarding 
  onComplete={(side) => handleSideSelect(side)}
/>
```

---

### TunnelLanding
**Location**: `/components/TunnelLanding.tsx`

3D tunnel effect with animated feature cards using GSAP.

```tsx
import TunnelLanding from './components/TunnelLanding';

<TunnelLanding 
  slides={degenSlides}
  onComplete={() => handleComplete()}
/>
```

**Features**:
- WebGL tunnel shader
- Card animation with GSAP ScrollTrigger
- First/last cards centered
- Middle cards alternate left/right (20%/60%)
- Tunnel positioned at y-offset 0.15 (middle-upper)

---

### FlowingShaderBackground
**Location**: `/components/FlowingShaderBackground.tsx`

Menger sponge fractal shader background.

```tsx
import { FlowingShaderBackground } from './components/FlowingShaderBackground';

<FlowingShaderBackground side="degen" />
```

**Props**:
- `side: 'degen' | 'regen'` - Changes shader colors

---

### Dashboard
**Location**: `/components/Dashboard.tsx`

Main dashboard with split-screen degen/regen view.

```tsx
import Dashboard from './components/Dashboard';

<Dashboard currentSide={currentSide} />
```

---

### DashboardNew
**Location**: `/components/DashboardNew.tsx`

Alternative dashboard layout with unified view.

```tsx
import DashboardNew from './components/DashboardNew';

<DashboardNew />
```

---

## Dashboard Widgets

All located in `/components/dashboard/`

### DegenHub
High-frequency trading tools and features.

### RegenHub
Long-term investment and security features.

### StatusBar
Top status bar with network, balance, and settings.

### BottomNav
Mobile bottom navigation bar.

### SniperBot
Token launch sniper bot interface.

### WhaleTracker
Track and mirror whale traders.

### MemeScanner
AI-powered meme coin detection.

### MEVShield
MEV protection toggle and stats.

### WalletGuard
Multi-signature wallet protection.

### InheritanceVault
GuardianX inheritance planning.

### EmergencyProtection
Panic mode and emergency features.

---

## Effect Components

All located in `/components/effects/`

### AnimatedGradientText
Animated gradient text effect.

```tsx
import { AnimatedGradientText } from './components/effects';

<AnimatedGradientText>
  Your Text Here
</AnimatedGradientText>
```

### BackgroundBeams
Animated beam background effect.

### Card3D
3D card with tilt effect.

```tsx
import { Card3D } from './components/effects';

<Card3D>
  <YourContent />
</Card3D>
```

### Meteors
Animated meteor shower effect.

### Sparkles
Sparkle animation effect.

### Spotlight
Spotlight effect following cursor.

### MovingBorder
Animated border effect.

### ShineBorder
Shimmering border effect.

---

## UI Components

All located in `/components/ui/`

### GlassCard
Glass morphism card component.

```tsx
import { GlassCard } from './components/ui/GlassCard';

<GlassCard className="p-6">
  <h2>Title</h2>
  <p>Content</p>
</GlassCard>
```

### Button
Styled button with variants.

```tsx
import { Button } from './components/ui/Button';

<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>
```

**Variants**: primary, secondary, ghost, destructive

### Modal
Full-featured modal dialog.

```tsx
import { Modal } from './components/ui/Modal';

<Modal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)}
  title="Modal Title"
>
  <ModalContent />
</Modal>
```

### Toast
Toast notifications (using Sonner).

```tsx
import { toast } from 'sonner@2.0.3';

toast.success('Operation successful');
toast.error('Something went wrong');
toast.info('Info message');
```

### Input
Form input component.

```tsx
import { Input } from './components/ui/Input';

<Input 
  type="text"
  placeholder="Enter value"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Tabs
Tabbed interface.

```tsx
import { Tabs } from './components/ui/Tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

---

## Feature Components

All located in `/components/features/`

### MEVProtection
MEV protection interface and settings.

### MemeRadar
Meme coin scanner with AI analysis.

### GuardianXInheritance
Inheritance vault and smart will builder.

### PortfolioAnalytics
Portfolio tracking and analytics.

### PrivacyShield
Zero-knowledge transaction features.

### WalletGuard
Multi-signature wallet management.

### WhaleTracker
Whale wallet tracking and mirroring.

### SniperBot
Token launch sniper configuration.

### DeFiDashboard
Cross-chain DeFi opportunities.

### GasManager
Gas fee optimization and monitoring.

### HelpCenter
In-app help and support center.

### LegalPages
Terms, privacy policy, and legal docs.

---

## Layout Components

All located in `/components/layout/`

### Container
Responsive container with max-width.

```tsx
import { Container } from './components/layout';

<Container>
  <YourContent />
</Container>
```

### Flex
Flexbox layout helper.

```tsx
import { Flex } from './components/layout';

<Flex direction="row" gap={4} align="center">
  <Item1 />
  <Item2 />
</Flex>
```

### Stack
Vertical stack layout.

```tsx
import { Stack } from './components/layout';

<Stack gap={4}>
  <Item1 />
  <Item2 />
</Stack>
```

### CardGrid
Responsive grid for cards.

```tsx
import { CardGrid } from './components/layout';

<CardGrid columns={3}>
  <Card1 />
  <Card2 />
  <Card3 />
</CardGrid>
```

---

## Utility Components

### ParadexLogo
Logo component with figma asset import.

```tsx
import { ParadexLogo } from './components/ParadexLogo';

<ParadexLogo className="w-48 h-48" />
```

### NoiseBackground
Noise texture background overlay.

```tsx
import NoiseBackground from './components/NoiseBackground';

<NoiseBackground />
```

### LoadingState
Loading spinner and skeleton states.

```tsx
import { LoadingState } from './components/LoadingState';

<LoadingState text="Loading..." />
```

### ErrorBoundary
React error boundary for graceful error handling.

```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### FadeTransition
Smooth fade transitions between views.

```tsx
import FadeTransition from './components/FadeTransition';

<FadeTransition show={isVisible}>
  <YourContent />
</FadeTransition>
```

---

## Hooks

### usePerformance
Monitor component performance and FPS.

```tsx
import { usePerformance } from './hooks/usePerformance';

const { fps, renderTime } = usePerformance();
```

### useScarletteWillAI
AI assistant hook for smart will creation.

```tsx
import { useScarletteWillAI } from './hooks/useScarletteWillAI';

const { generateWill, suggestions } = useScarletteWillAI();
```

---

## Utilities

### Three.js Singleton
Shared Three.js instance to prevent multiple WebGL contexts.

```tsx
import * as THREE from './utils/three';

const scene = new THREE.Scene();
```

### Performance Monitoring
Performance tracking utilities.

```tsx
import { trackPerformance, measureFPS } from './utils/performance';

trackPerformance('componentName');
const fps = measureFPS();
```

### Cache Management
Caching strategies for data and assets.

```tsx
import { cacheData, getCachedData } from './utils/cache';

await cacheData('key', data);
const cached = getCachedData('key');
```

---

## Color Reference

### Degen Colors
```css
--degen-primary: #DC143C;  /* Crimson Red */
--degen-gradient: linear-gradient(135deg, #DC143C 0%, #A0112A 100%);
```

### Regen Colors
```css
--regen-primary: #9333EA;  /* Purple */
--regen-secondary: #0080FF; /* Blue */
--regen-gradient: linear-gradient(135deg, #9333EA 0%, #0080FF 100%);
```

### Chrome Colors
```css
--chrome-light: #E8E8E8;
--chrome-medium: #C0C0C0;
--chrome-dark: #808080;
```

---

## Import Patterns

### Component Import
```tsx
// Named export
import { ComponentName } from './components/ComponentName';

// Default export
import ComponentName from './components/ComponentName';

// Index export
import { Component1, Component2 } from './components/ui';
```

### Asset Import
```tsx
// Figma assets (raster images)
import image from 'figma:asset/abc123.png';

// SVG imports (from /imports folder)
import svgPaths from './imports/svg-abc123';

// Regular images
import { ImageWithFallback } from './components/figma/ImageWithFallback';
```

### Lazy Loading
```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./components/HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HeavyComponent />
    </Suspense>
  );
}
```
