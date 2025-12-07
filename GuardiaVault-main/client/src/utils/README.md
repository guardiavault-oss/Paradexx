# UI/UX Enhancement Utilities

This directory contains utility functions and hooks for accessibility, performance, and user experience enhancements.

## Accessibility Utilities (`accessibility.ts`)

### `SkipToMain`
Skip link component for keyboard navigation. Provides a way to skip navigation and jump directly to main content.

**Usage:**
```tsx
import { SkipToMain } from '@/utils/accessibility';

function App() {
  return (
    <>
      <SkipToMain />
      <Navigation />
      <main id="main-content">...</main>
    </>
  );
}
```

### `useFocusTrap`
Hook for trapping keyboard focus within modals, dialogs, and overlays. Ensures users can't tab out of modal dialogs.

**Usage:**
```tsx
import { useFocusTrap } from '@/utils/accessibility';

function Modal({ isOpen }: { isOpen: boolean }) {
  const containerRef = useFocusTrap(isOpen);
  
  return (
    <div ref={containerRef}>
      {/* Modal content - focus is trapped here */}
    </div>
  );
}
```

### `useAnnounce`
Hook for announcing dynamic content changes to screen readers.

**Usage:**
```tsx
import { useAnnounce } from '@/utils/accessibility';

function SearchResults() {
  const announce = useAnnounce();
  
  useEffect(() => {
    if (results.length > 0) {
      announce(`Found ${results.length} results`);
    }
  }, [results, announce]);
}
```

### `useKeyboardNavigation`
Hook for keyboard-accessible navigation in lists, menus, and dropdowns.

**Usage:**
```tsx
import { useKeyboardNavigation } from '@/utils/accessibility';

function Menu({ items }: { items: string[] }) {
  const { focusedIndex } = useKeyboardNavigation(items, (item) => {
    console.log('Selected:', item);
  });
  
  return (
    <ul>
      {items.map((item, index) => (
        <li key={item} className={index === focusedIndex ? 'focused' : ''}>
          {item}
        </li>
      ))}
    </ul>
  );
}
```

### `getAriaLabel`
Utility function for generating consistent ARIA labels.

**Usage:**
```tsx
import { getAriaLabel } from '@/utils/accessibility';

<button aria-label={getAriaLabel('button', 'close')}>
  ×
</button>
```

### `checkContrast`
Utility for checking color contrast ratios for WCAG compliance.

**Usage:**
```tsx
import { checkContrast } from '@/utils/accessibility';

const result = checkContrast('#000000', '#ffffff');
console.log(result.passesAA); // true
console.log(result.ratio); // "21.00"
```

## Performance Utilities (`performance.ts`)

### `LazyImage`
Component for lazy loading images with Intersection Observer. 
**Note:** Your project already has `OptimizedImage` component which provides similar functionality with WebP support.

### `useDebounce`
Hook for debouncing values, useful for search inputs and API calls.

**Usage:**
```tsx
import { useDebounce } from '@/utils/performance';

function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  
  useEffect(() => {
    // API call will only fire 500ms after user stops typing
    searchAPI(debouncedQuery);
  }, [debouncedQuery]);
}
```

### `useThrottle`
Hook for throttling function calls, useful for scroll and resize event handlers.

**Usage:**
```tsx
import { useThrottle } from '@/utils/performance';

function ScrollComponent() {
  const handleScroll = useThrottle((e: Event) => {
    console.log('Scroll position:', window.scrollY);
  }, 100);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
}
```

### `VirtualList`
Component for rendering large lists efficiently using virtualization.

**Usage:**
```tsx
import { VirtualList } from '@/utils/performance';

function LargeList({ items }: { items: Item[] }) {
  return (
    <VirtualList
      items={items}
      itemHeight={50}
      containerHeight={400}
      renderItem={(item, index) => (
        <div key={index}>{item.name}</div>
      )}
    />
  );
}
```

### `lazyLoadComponent`
Utility for code-splitting components with lazy loading.

**Usage:**
```tsx
import { lazyLoadComponent } from '@/utils/performance';

const HeavyComponent = lazyLoadComponent('./HeavyComponent');

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### `createSelector`
Utility for memoizing expensive computations (similar to Redux selectors).

**Usage:**
```tsx
import { createSelector } from '@/utils/performance';

const expensiveComputation = createSelector(
  (data) => data.items,
  (data) => data.filter,
  (items, filter) => items.filter(item => item.name.includes(filter))
);
```

### `scheduleIdleTask`
Utility for scheduling non-critical tasks during browser idle time.

**Usage:**
```tsx
import { scheduleIdleTask } from '@/utils/performance';

// Schedule analytics or non-critical updates
scheduleIdleTask(() => {
  updateAnalytics();
});
```

### `createWorker`
Utility for creating Web Workers for heavy computations off the main thread.

**Usage:**
```tsx
import { createWorker } from '@/utils/performance';

const worker = createWorker((e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
});

worker.postMessage({ data: largeDataset });
```

### `preloadResources`
Utility for preloading critical resources (fonts, scripts, images).

**Usage:**
```tsx
import { preloadResources } from '@/utils/performance';

preloadResources([
  { url: '/fonts/main.woff2', type: 'font' },
  { url: '/scripts/critical.js', type: 'script' },
]);
```

## Integration with Existing Components

### Using with Shadcn/UI Components
These utilities complement your existing Radix UI components:

- **Focus Trap + Dialog:** Add `useFocusTrap` to your dialog components for better accessibility
- **Debounce + Search:** Use `useDebounce` with your search inputs
- **Virtual List + Tables:** Use `VirtualList` for large data tables in your dashboard

### Using with Existing OptimizedImage
Your `OptimizedImage` component already handles lazy loading. These utilities provide additional patterns:
- Use `useDebounce` for search/filter inputs
- Use `useThrottle` for scroll-based animations
- Use `VirtualList` for large lists of items

## Best Practices

1. **Accessibility First:** Always use `useFocusTrap` for modals and dialogs
2. **Performance:** Use `useDebounce` for all user input that triggers API calls
3. **Large Lists:** Use `VirtualList` for any list with 100+ items
4. **Code Splitting:** Use `lazyLoadComponent` for route-level components
5. **Screen Readers:** Use `useAnnounce` for dynamic content updates

## TypeScript Support

All utilities are fully typed with TypeScript and work seamlessly with your existing codebase.

