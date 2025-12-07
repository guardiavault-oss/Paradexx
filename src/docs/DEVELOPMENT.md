# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or bun package manager

### Installation
```bash
# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5173`

## Development Workflow

### Component Development
1. Create components in appropriate subdirectory under `/components`
2. Use TypeScript for type safety
3. Follow naming conventions (PascalCase for components)
4. Export from index files where applicable

### Styling
1. Use Tailwind CSS classes
2. Do NOT override typography classes unless requested
3. Use design tokens from `/styles/globals.css`
4. Follow the glass morphism aesthetic

### Creating New Features
```tsx
// 1. Create component file
// /components/features/NewFeature.tsx

import { GlassCard } from '../ui/GlassCard';

export function NewFeature() {
  return (
    <GlassCard>
      {/* Feature content */}
    </GlassCard>
  );
}

// 2. Export from index
// /components/features/index.ts
export { NewFeature } from './NewFeature';

// 3. Use in application
import { NewFeature } from './components/features';
```

## Working with WebGL

### Shader Components
- Located in `/components/FlowingShaderBackground.tsx`
- Uses Three.js for WebGL rendering
- Implements custom shaders (GLSL)

### Performance Considerations
1. Always lazy load WebGL components
2. Monitor frame rates with performance hooks
3. Dispose of geometries and materials properly
4. Use `useEffect` cleanup for Three.js scenes

```tsx
const ThreeComponent = lazy(() => import('./components/ThreeComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ThreeComponent />
    </Suspense>
  );
}
```

## Backend Development

### Server Routes
Located in `/supabase/functions/server/index.tsx`

```typescript
import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';

const app = new Hono();
app.use('*', cors());

// Add routes
app.get('/make-server-50a0f5e4/your-route', async (c) => {
  // Implementation
  return c.json({ data: 'response' });
});

Deno.serve(app.fetch);
```

### Database Operations
Use the KV store for simple key-value operations:

```typescript
import * as kv from './kv_store';

// Set value
await kv.set('key', { data: 'value' });

// Get value
const result = await kv.get('key');

// Get multiple
const results = await kv.mget(['key1', 'key2']);

// Delete
await kv.del('key');
```

## Testing

### Manual Testing Checklist
- [ ] Mobile responsiveness (use Chrome DevTools)
- [ ] Glass morphism effects render correctly
- [ ] Animations are smooth (60fps target)
- [ ] WebGL components load without errors
- [ ] Navigation flows work correctly
- [ ] Form submissions and validations work
- [ ] Dark mode consistency

### Browser Testing
- Chrome (primary)
- Safari (iOS compatibility)
- Firefox
- Edge

## Common Issues

### WebGL Not Rendering
1. Check console for WebGL errors
2. Verify Three.js version compatibility
3. Ensure cleanup in useEffect
4. Check for multiple Three.js instances

### Tailwind Classes Not Working
1. Verify class names are correct
2. Check `/styles/globals.css` for conflicts
3. Ensure Tailwind v4 syntax is used
4. Clear cache and rebuild

### Import Errors
1. Use correct import paths (relative paths)
2. Check for circular dependencies
3. Verify export statements in index files

## Code Style

### TypeScript
```typescript
// Use interfaces for props
interface ComponentProps {
  title: string;
  onAction: () => void;
  isActive?: boolean;
}

// Use explicit return types for complex functions
function processData(data: string[]): ProcessedData {
  // Implementation
}
```

### React
```tsx
// Prefer functional components
export function Component({ prop }: ComponentProps) {
  return <div>{prop}</div>;
}

// Use named exports
export { Component };

// Destructure props
const { title, onAction } = props;
```

## Git Workflow

### Branching
- `main` - Production-ready code
- `develop` - Development branch
- `feature/feature-name` - Feature branches

### Commits
Use conventional commits:
```
feat: add new dashboard widget
fix: resolve WebGL memory leak
docs: update API documentation
style: format code with prettier
refactor: simplify authentication flow
```

## Performance Monitoring

### Browser DevTools
1. Performance tab for profiling
2. Network tab for bundle size
3. Console for errors and warnings

### React DevTools
1. Component render counts
2. Props/state inspection
3. Performance profiler
