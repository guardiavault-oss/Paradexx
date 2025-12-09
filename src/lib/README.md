# Enhanced Component Library - Enterprise Edition

This directory contains advanced animation, interaction, and UI systems that provide enterprise-grade features for the Paradexx wallet application.

## 📦 Core Systems

### Animation & Performance

#### `animation-engine.ts`
High-performance animation system with GPU acceleration and frame budget management.

**Features:**
- **GPU Acceleration Manager**: Automatic `will-change` injection and layer promotion
- **Frame Budget System**: Maintains 60fps with automatic quality degradation
- **Reduced Motion System**: Respects user preferences with graceful alternatives
- **Animation Profiler**: Dev-mode FPS overlay and performance tracking
- **Batch Renderer**: Groups animations into single requestAnimationFrame
- **Visibility Manager**: Pauses off-screen animations automatically

**Usage:**
```typescript
import AnimationEngine from '@/lib/animation-engine';

// Prepare animation
const animId = AnimationEngine.prepareAnimation(
  element,
  ['transform', 'opacity'],
  { priority: 'high', duration: 300 }
);

// Complete when done
AnimationEngine.completeAnimation(animId, element);

// Access subsystems
const fps = AnimationEngine.getFrameBudget().getCurrentFPS();
const shouldReduce = AnimationEngine.getReducedMotion().isReducedMotion();
```

### Interaction Systems

#### `gestures.ts`
Advanced touch gesture recognition with physics engine.

**Features:**
- **Touch Gestures**: Swipe, pinch, long press, drag, double tap
- **Physics Engine**: Springs, momentum, snap points, rubberband effects
- **Gesture Hooks**: React hooks for each gesture type
- **Gesture State Machine**: Manages gesture lifecycle

**Usage:**
```typescript
import { useSwipe, usePinch, useDrag } from '@/lib/gestures';

// Swipe detection
const swipeState = useSwipe(ref, {
  threshold: 50,
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => console.log('Swiped right'),
});

// Pinch to zoom
const { scale, center, isActive } = usePinch(ref, {
  onPinchMove: (scale, center) => {
    console.log(`Pinched to ${scale}x at`, center);
  },
});

// Drag with momentum
const { position, isDragging } = useDrag(ref, {
  momentum: true,
  snapPoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
  onDragEnd: (pos, velocity) => console.log('Dropped at', pos),
});
```

#### `haptics.ts`
Tactile feedback system with pattern library.

**Features:**
- **Pattern Library**: light, medium, heavy, error, success, warning
- **Audio Fallback**: For devices without haptic support
- **Auto-Haptics**: Automatically add haptics to UI elements
- **User Preferences**: localStorage-backed settings

**Usage:**
```typescript
import { useHaptics, useAutoHaptics } from '@/lib/haptics';

const { light, medium, success, error } = useHaptics();

// Trigger haptics
light(); // Subtle tap (10ms)
medium(); // Standard tap (25ms)
success(); // Triple ascending pattern
error(); // Double buzz pattern

// Auto-haptics for button
const buttonRef = useRef<HTMLButtonElement>(null);
useAutoHaptics(buttonRef, 'button'); // Adds haptics automatically
```

### Transitions & Animations

#### `shared-transitions.tsx`
FLIP-based hero transitions for shared elements.

**Features:**
- **Hero Transitions**: Smooth element morphing between routes
- **FLIP Technique**: First, Last, Invert, Play for performant animations
- **Z-Index Management**: Automatic stacking during transitions
- **List-to-Detail**: Specialized transitions for list navigation
- **Debug Mode**: Visual debugging of transition boundaries

**Usage:**
```typescript
import { SharedElementProvider, SharedElement } from '@/lib/shared-transitions';

// Wrap app with provider
<SharedElementProvider>
  <App />
</SharedElementProvider>

// Mark elements for transition
<SharedElement id="wallet-card-123">
  <WalletCard />
</SharedElement>

// On detail page, same ID triggers transition
<SharedElement id="wallet-card-123">
  <WalletDetailView />
</SharedElement>
```

### Accessibility

#### `accessibility.ts`
Comprehensive accessibility features for animations and interactions.

**Features:**
- **Screen Reader Announcements**: aria-live regions for dynamic content
- **Focus Management**: Traps, restoration, roving tabindex, skip links
- **Motion Alternatives**: Graceful fallbacks for reduced motion
- **Contrast Checker**: WCAG compliance validation

**Usage:**
```typescript
import {
  useAccessibleAnnounce,
  useFocusTrap,
  useContrastCheck,
  useReducedMotion,
} from '@/lib/accessibility';

// Announce to screen readers
const announce = useAccessibleAnnounce();
announce('Transaction completed', 'polite');

// Trap focus in modal
const modalRef = useRef<HTMLDivElement>(null);
useFocusTrap(modalRef, { returnFocus: true });

// Check contrast
const contrast = useContrastCheck('#ffffff', '#000000');
// { ratio: 21, level: 'AAA', ... }

// Respect reduced motion preference
const shouldReduce = useReducedMotion();
```

### Visual Effects

#### `celebrations.ts`
Delightful particle effects and celebrations.

**Features:**
- **Particle System**: Confetti, fireworks, coin rain
- **Screen Effects**: Shake and glow animations
- **Sound Effects**: Optional audio feedback
- **Reduced Motion**: Static badge alternatives
- **Milestone Detection**: Automatic celebrations

**Usage:**
```typescript
import { useCelebrations, useMilestoneCelebration } from '@/lib/celebrations';

const { celebrate, glow, shake } = useCelebrations();

// Trigger celebrations
celebrate('confetti', { intensity: 'high' });
celebrate('fireworks', { duration: 4000 });
celebrate('coinRain', { colors: ['#FFD700', '#FFA500'] });

// Glow effect
await glow(element, 1000);

// Screen shake
shake(undefined, 'medium');

// Auto-celebrate milestones
useMilestoneCelebration(
  portfolioValue,
  [1000, 10000, 100000],
  'fireworks'
);
```

#### `theme-engine.ts`
Smooth theme transitions with perceptually uniform color interpolation.

**Features:**
- **OKLCH Interpolation**: Perceptually uniform color transitions
- **Theme Modes**: Degen ↔ Regen smooth transitions
- **Time-Based Theming**: Auto-adjust for time of day
- **Contrast Preservation**: Maintains WCAG compliance during transitions

**Usage:**
```typescript
import { useThemeMode, useTimeBasedTheming } from '@/lib/theme-engine';

const { mode, switchMode, toggleMode } = useThemeMode();

// Switch themes smoothly
switchMode('regen', false); // Animated
switchMode('degen', true);  // Instant

// Enable time-based adjustments
useTimeBasedTheming({
  enabled: true,
  dimAtNight: true,
  sunriseSunset: true,
});
```

## 🎨 UI Components

### Visualization Components

#### `PriceTicker.tsx`
Live price display with number morphing animation.

**Features:**
- **Number Morphing**: Each digit animates independently
- **Color Flash**: Green up, red down on changes
- **Sparkline**: Mini chart background
- **Delta Indicator**: Shows change amount and percentage

**Usage:**
```typescript
import PriceTicker from '@/components/viz/PriceTicker';

<PriceTicker
  value={1234.56}
  decimals={2}
  currency="$"
  showChange={true}
  showSparkline={true}
  history={[1200, 1210, 1230, 1234.56]}
  size="lg"
/>
```

### Advanced UI Components

#### `SmartSkeleton.tsx`
Skeleton-to-content morphing system using FLIP technique.

**Features:**
- **FLIP Morphing**: Smooth skeleton → content transition
- **Dimension Tracking**: Automatically captures bounding boxes
- **Staggered Lists**: Animated list morphing
- **Preset Shapes**: Ready-to-use skeleton components

**Usage:**
```typescript
import SmartSkeleton, { WalletCardSkeleton } from '@/components/ui/SmartSkeleton';

<SmartSkeleton
  isLoading={isLoading}
  skeleton={<WalletCardSkeleton />}
  morphDuration={400}
>
  <WalletCard data={data} />
</SmartSkeleton>
```

#### `VirtualizedList.tsx`
High-performance windowed rendering with animations.

**Features:**
- **Windowed Rendering**: Only renders visible items + overscan
- **Variable Heights**: Automatic measurement and adjustment
- **Pull-to-Refresh**: iOS-style rubberband physics
- **Infinite Scroll**: Built-in infinite loading wrapper
- **Enter/Exit Animations**: Smooth item transitions

**Usage:**
```typescript
import VirtualizedList, { InfiniteScrollList } from '@/components/ui/VirtualizedList';

<VirtualizedList
  items={transactions}
  height={600}
  itemHeight={80}
  overscan={3}
  renderItem={(tx, index) => <TransactionRow {...tx} />}
  enterAnimation="slideUp"
  pullToRefresh={true}
  onRefresh={async () => await refetch()}
/>

// Or with infinite scroll
<InfiniteScrollList
  items={items}
  height={600}
  itemHeight={80}
  hasMore={hasMore}
  loadMore={loadMore}
  renderItem={(item, index) => <ItemRow {...item} />}
/>
```

## 🎯 State Management

### UI State Machines

#### `ui-machines/index.ts`
State machines for complex UI flows.

**Features:**
- **Transaction Flow**: Multi-step transaction with retries
- **Modal Stack**: Z-index management and ESC handling
- **Form Wizard**: Multi-step forms with validation
- **Notification Queue**: Priority-based notifications

**Usage:**
```typescript
import {
  useTransactionMachine,
  useModalStack,
  useFormWizard,
  useNotificationQueue,
} from '@/lib/ui-machines';

// Transaction flow
const { state, context, send, is } = useTransactionMachine();
send({ type: 'INPUT', payload: { amount: '1.5' } });
send({ type: 'VALIDATE' });
if (is('error')) {
  console.log(context.error);
}

// Modal stack
const { stack, open, closeTop } = useModalStack();
open({
  id: 'confirm-tx',
  component: ConfirmModal,
  props: { transaction: tx },
  closeOnEscape: true,
});

// Form wizard
const { currentStep, next, previous, getProgress } = useFormWizard(steps);

// Notifications
const { visible, add } = useNotificationQueue();
add({
  message: 'Transaction confirmed!',
  priority: 'success',
  duration: 5000,
});
```

## 🎭 Performance Considerations

### GPU Acceleration
- Automatic `will-change` injection before animations
- Removed after animation completes (100ms delay)
- Layer promotion for complex animations
- Automatic fallback for low-power devices

### Frame Budget
- Targets 60fps (16.67ms per frame)
- Monitors dropped frames
- Automatically reduces quality if needed
- Tracks up to 60 frames for averaging

### Animation Profiling
- Dev-mode overlay with FPS counter
- Per-animation cost tracking
- Jank detection and logging
- Exportable performance reports

### Virtualization
- Only renders visible items + overscan buffer
- Automatic height measurement for variable-height items
- Pauses off-screen animations
- Efficient scroll handling with debouncing

## 🌐 Browser Support

All features include graceful fallbacks:
- **Haptics**: Falls back to audio cues
- **Reduced Motion**: Falls back to instant transitions
- **IntersectionObserver**: Falls back to always-active animations
- **Web Audio API**: Silently fails if unavailable

## 🔧 Development Tools

### Animation Profiler
Enable in development:
```typescript
AnimationEngine.getProfiler().enable();
```

Shows overlay with:
- Current FPS
- Active animation count
- Recent animation costs
- Jank detection

### Shared Element Debug
```typescript
import { useSharedElementDebug } from '@/lib/shared-transitions';

useSharedElementDebug(true); // Shows element IDs and boundaries
```

### Performance Export
```typescript
const report = AnimationEngine.exportPerformanceReport();
console.log(JSON.parse(report.profiler));
```

## 📚 Best Practices

1. **Always use GPU-accelerated properties** when possible (transform, opacity)
2. **Prepare animations** before starting for optimal performance
3. **Respect user preferences** (reduced motion, contrast, haptics)
4. **Use SmartSkeleton** instead of abrupt loading states
5. **Virtualize long lists** for better performance
6. **Test with Animation Profiler** to catch performance issues
7. **Provide fallbacks** for all advanced features

## 🚀 Getting Started

```typescript
// 1. Wrap your app with providers
import { SharedElementProvider } from '@/lib/shared-transitions';

function App() {
  return (
    <SharedElementProvider>
      {/* Your app */}
    </SharedElementProvider>
  );
}

// 2. Initialize animation engine (automatic on import)
import AnimationEngine from '@/lib/animation-engine';

// 3. Use hooks in your components
import { useHaptics } from '@/lib/haptics';
import { useCelebrations } from '@/lib/celebrations';
import { useThemeMode } from '@/lib/theme-engine';

function MyComponent() {
  const haptics = useHaptics();
  const { celebrate } = useCelebrations();
  const { toggleMode } = useThemeMode();

  return (
    <button
      onClick={() => {
        haptics.medium();
        celebrate('confetti');
        toggleMode();
      }}
    >
      Switch Theme
    </button>
  );
}
```

## 📝 License

Part of the Paradexx project. All rights reserved.
