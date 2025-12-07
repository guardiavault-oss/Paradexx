# Paradox Wallet Design System

A comprehensive, mode-aware design system for the Paradox Wallet application featuring contrasting "Degen" (Fire) and "Regen" (Ice) identities.

---

## 🎯 Quick Start

### For New Developers

```typescript
// Import design tokens
import { palette, colors, modeColors } from '@/design-system/tokens';
import { getAccentColor, getGradient, getGlow } from '@/design-system/tokens';

// Use mode-aware colors
const accentColor = getAccentColor('degen', 'primary'); // #ff3366
const gradient = getGradient('regen', 'primary'); // linear-gradient(90deg, #00d4ff, #00ff88)
```

### For Migrating Existing Code

```bash
# See what will change (safe preview)
./design-system/run-migration.sh preview

# Run migration with backups
./design-system/run-migration.sh migrate

# View migration report
./design-system/run-migration.sh report
```

**→ [Complete Migration Guide](./MIGRATION-INDEX.md)**

---

## 📚 Documentation

### Core Documentation
- **[MIGRATION-INDEX.md](./MIGRATION-INDEX.md)** - Start here for migration
- **[MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)** - Detailed migration walkthrough
- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Fast lookup for common patterns
- **[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)** - Design philosophy and principles
- **[VISUAL-GUIDE.md](./VISUAL-GUIDE.md)** - Visual examples and patterns

### Technical Documentation  
- **[tokens.ts](./tokens.ts)** - All design token definitions
- **[globals.css](./globals.css)** - CSS variables and utility classes
- **[token-mapping.json](./token-mapping.json)** - Old → New token mappings

### Tools
- **[migrate-tokens.ts](./migrate-tokens.ts)** - Automated migration script
- **[run-migration.sh](./run-migration.sh)** - Easy migration runner

---

## 🎨 Design Tokens

### Color System

#### Degen (Fire) Colors
```typescript
palette.degen.primary    // #ff3366 - Main brand red
palette.degen.secondary  // #ff9500 - Orange accent
palette.degen.tertiary   // #ff6b6b - Light red
```

#### Regen (Ice) Colors
```typescript
palette.regen.primary    // #00d4ff - Main brand cyan
palette.regen.secondary  // #00ff88 - Green accent
palette.regen.tertiary   // #00aaff - Light blue
```

#### Semantic Colors
```typescript
colors.background.primary     // rgba(0, 0, 0, 0.95)
colors.background.glass.medium // rgba(0, 0, 0, 0.6)
colors.text.primary           // #ffffff
colors.text.secondary         // rgba(255, 255, 255, 0.7)
colors.border.subtle          // rgba(255, 255, 255, 0.1)
```

### Mode-Aware Tokens

```typescript
// Automatically switches based on mode
modeColors.degen.accent.primary        // #ff3366
modeColors.regen.accent.primary        // #00d4ff

// Utility functions
getAccentColor(mode, 'primary')        // Returns correct color for mode
getGradient(mode, 'primary')           // Returns mode-specific gradient
getGlow(mode, 'md')                    // Returns mode-specific glow shadow
```

---

## 🛠️ Usage Examples

### Basic Component with Mode Colors

```tsx
import { getAccentColor, getGlow } from '@/design-system/tokens';

function ModeAwareButton({ mode }: { mode: 'degen' | 'regen' }) {
  return (
    <button
      style={{
        backgroundColor: getAccentColor(mode, 'primary'),
        boxShadow: getGlow(mode, 'md')
      }}
    >
      Click Me
    </button>
  );
}
```

### Glassmorphism Card

```tsx
import { GlassCard } from '@/design-system/components/GlassCard';

function MyCard() {
  return (
    <GlassCard intensity="medium" accentBorder>
      Card content here
    </GlassCard>
  );
}

// Or use utility class
<div className="glass-medium rounded-2xl p-6">
  Card content
</div>
```

### Using CSS Variables

```css
.my-component {
  background: var(--bg-glass-medium);
  backdrop-filter: blur(var(--blur-md));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}

/* Mode-aware styling */
.my-button {
  background: var(--accent-primary); /* Auto-switches */
  box-shadow: var(--glow-md);
}
```

---

## 📦 What's Included

### Tokens
- **300+ unique values** consolidated into **~50 semantic tokens**
- Color palette (Degen/Regen/Neutral)
- Typography (fonts, sizes, weights, spacing)
- Spacing scale (4px base)
- Border radius values
- Shadow & glow effects
- Blur values
- Transitions & animations
- Z-index layers

### CSS Utilities
- Glass effects (`.glass-subtle`, `.glass-medium`, `.glass-strong`)
- Button styles (`.btn-primary`, `.btn-secondary`, `.btn-ghost`)
- Text effects (`.text-gradient`, `.text-3d-degen`, `.text-3d-regen`)
- Animations (`.animate-gradient`, `.animate-pulse-glow`)
- Layout helpers (`.container-center`, `.section-spacing`)

### Components
- **GlassCard** - Reusable glassmorphism card component

### Utility Functions
- `getAccentColor(mode, variant)` - Get mode-specific accent
- `getGradient(mode, type)` - Get mode-specific gradient
- `getGlow(mode, size)` - Get mode-specific glow shadow

---

## 🔄 Migration Guide

### Option 1: Automated Migration (Recommended)

```bash
# 1. Preview changes (safe, no modifications)
./design-system/run-migration.sh preview

# 2. Review the output

# 3. Run migration with backups
./design-system/run-migration.sh migrate

# 4. Test your application

# 5. Remove backups after verification
find . -name '*.backup' -delete
```

### Option 2: Manual Migration

1. Open **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)**
2. Use find-and-replace for common patterns
3. Reference **[token-mapping.json](./token-mapping.json)** for exact mappings
4. Test thoroughly

**→ [Complete Migration Guide](./MIGRATION-INDEX.md)**

---

## 🎯 Key Features

### ✅ Semantic Naming
Clear, purpose-driven token names that describe their use, not their appearance.

### ✅ Mode-Aware Colors  
Automatic color switching between Degen (fire) and Regen (ice) modes.

### ✅ Reduced Complexity
From 300+ tokens to ~50 semantic tokens without losing functionality.

### ✅ Better Developer Experience
- TypeScript type safety
- Utility functions for common patterns
- CSS custom properties
- Comprehensive documentation

### ✅ Consistent Design
All components use the same token system ensuring visual consistency.

### ✅ Easy Theming
Switch between Degen/Regen modes with a single prop or data attribute.

---

## 🎨 Design Principles

1. **Semantic over Specific** - Tokens describe purpose, not appearance
2. **Mode-Aware by Default** - Support both Degen and Regen from the start
3. **Consolidation over Proliferation** - Fewer, more meaningful tokens
4. **Developer Experience First** - Easy to use, hard to misuse
5. **Performance Optimized** - CSS variables for efficient runtime switching

---

## 📖 Design System Structure

```
design-system/
├── tokens.ts                    # All design token definitions
├── globals.css                  # CSS variables & utility classes
├── index.ts                     # Main exports
├── components/
│   └── GlassCard.tsx           # Reusable components
│
├── MIGRATION-INDEX.md          # Migration hub (START HERE)
├── MIGRATION-GUIDE.md          # Detailed migration guide
├── QUICK-REFERENCE.md          # Quick lookup
├── token-mapping.json          # Old → New mappings
├── migrate-tokens.ts           # Migration script
├── run-migration.sh            # Migration runner
│
├── DESIGN-SYSTEM.md            # Design philosophy
├── VISUAL-GUIDE.md             # Visual examples
├── IMPLEMENTATION-SUMMARY.md   # Implementation details
└── README.md                   # This file
```

---

## 🚀 Getting Started

### 1. For New Projects

```typescript
// Import what you need
import { 
  palette, 
  colors, 
  modeColors,
  getAccentColor 
} from '@/design-system/tokens';

// Use in your components
function MyComponent({ mode }: { mode: 'degen' | 'regen' }) {
  return (
    <div style={{
      backgroundColor: colors.background.glass.medium,
      color: getAccentColor(mode, 'primary')
    }}>
      Hello Paradox!
    </div>
  );
}
```

### 2. For Existing Projects

**Step 1:** Run migration preview
```bash
./design-system/run-migration.sh preview
```

**Step 2:** Review changes and run migration
```bash
./design-system/run-migration.sh migrate
```

**Step 3:** Test and verify
- Check visual appearance
- Test mode switching
- Verify responsive behavior

**→ [Complete Migration Guide](./MIGRATION-INDEX.md)**

---

## 📚 Learn More

### For Quick Reference
- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Common patterns and lookups

### For Deep Understanding
- **[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)** - Philosophy and principles
- **[VISUAL-GUIDE.md](./VISUAL-GUIDE.md)** - Visual examples

### For Migration
- **[MIGRATION-INDEX.md](./MIGRATION-INDEX.md)** - Migration hub
- **[MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)** - Step-by-step guide
- **[token-mapping.json](./token-mapping.json)** - Token mappings

---

## 🤝 Contributing

When adding new tokens or components:

1. Follow semantic naming conventions
2. Support both Degen and Regen modes
3. Add to appropriate section in `tokens.ts`
4. Update CSS variables in `globals.css` if needed
5. Document in relevant guides
6. Update `token-mapping.json` for migrations

---

## 📄 License

Part of the Paradox Wallet project.

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| **Migration Start** | [MIGRATION-INDEX.md](./MIGRATION-INDEX.md) |
| **Quick Lookup** | [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) |
| **All Tokens** | [tokens.ts](./tokens.ts) |
| **CSS Variables** | [globals.css](./globals.css) |
| **Token Mappings** | [token-mapping.json](./token-mapping.json) |
| **Design Philosophy** | [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) |

---

**Version:** 1.0.0  
**Last Updated:** December 4, 2024  
**Status:** ✅ Production Ready