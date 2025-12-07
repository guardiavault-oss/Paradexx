# Contributing to Paradex

Thank you for your interest in contributing to Paradex! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

---

## Code of Conduct

### Our Pledge
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior
- Harassment or discriminatory language
- Trolling or insulting comments
- Publishing others' private information
- Other conduct deemed inappropriate

---

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Git for version control
- Code editor (VS Code recommended)
- Basic knowledge of React and TypeScript

### Initial Setup
```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/paradex.git
cd paradex

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

### Project Documentation
Before contributing, familiarize yourself with:
- [README.md](README.md) - Project overview
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - Development guide
- [docs/COMPONENT_REFERENCE.md](docs/COMPONENT_REFERENCE.md) - Component API

---

## Development Workflow

### Branch Naming
```
feature/description      # New features
fix/description         # Bug fixes
docs/description        # Documentation updates
refactor/description    # Code refactoring
style/description       # Code formatting
test/description        # Adding tests
chore/description       # Maintenance tasks
```

Example: `feature/add-token-swap`

### Commit Messages
Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(dashboard): add whale tracker widget
fix(tunnel): correct card positioning on mobile
docs(readme): update installation instructions
refactor(ui): simplify button component
style(app): format with prettier
perf(shader): optimize WebGL rendering
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Keep your branch up to date
git fetch origin
git rebase origin/main

# Push to your fork
git push origin feature/your-feature

# Create Pull Request on GitHub
```

---

## Coding Standards

### TypeScript
```typescript
// Use interfaces for props
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

// Use explicit return types for complex functions
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Prefer type inference for simple cases
const count = 5; // Type inferred as number
```

### React Components
```tsx
// Use functional components
export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn btn-${variant}`}>
      {label}
    </button>
  );
}

// Use named exports
export { Button };

// Destructure props
const { title, onAction, isActive } = props;

// Use hooks properly
useEffect(() => {
  // Effect code
  
  return () => {
    // Cleanup
  };
}, [dependencies]);
```

### Styling
```tsx
// Use Tailwind CSS classes
<div className="flex items-center gap-4 p-6 bg-black/50 backdrop-blur-xl">
  <span className="text-white">Content</span>
</div>

// Do NOT override typography unless requested
// ❌ Don't do this
<h1 className="text-2xl font-bold leading-tight">Title</h1>

// ✅ Do this (use defaults from globals.css)
<h1>Title</h1>

// Use design tokens and utilities
import { cn } from '@/lib/cn';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)}>
```

### File Organization
```typescript
// Component file structure:
// 1. Imports
import { useState } from 'react';
import { Button } from './ui/Button';

// 2. Types
interface Props {
  // ...
}

// 3. Constants (if any)
const DEFAULT_TIMEOUT = 5000;

// 4. Component
export function Component(props: Props) {
  // Implementation
}

// 5. Exports
export type { Props };
```

### Performance Best Practices
```typescript
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks passed to children
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);

// Cleanup in useEffect
useEffect(() => {
  const subscription = subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## Pull Request Process

### Before Submitting
- [ ] Code follows project style guidelines
- [ ] All new features have appropriate documentation
- [ ] No console.log statements (use logger utility)
- [ ] Tested on Chrome, Firefox, and Safari
- [ ] Mobile responsive (tested in DevTools)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Updated CHANGELOG.md if applicable

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested on multiple browsers
```

### Review Process
1. **Automated Checks**: CI/CD runs automatically
2. **Code Review**: Maintainers review within 2-3 days
3. **Feedback**: Address review comments
4. **Approval**: Two approvals required for merge
5. **Merge**: Maintainer will merge when ready

### After Merge
- Delete your feature branch
- Pull latest changes to your fork
- Close related issues

---

## Issue Guidelines

### Reporting Bugs
Use the bug report template:

```markdown
**Describe the bug**
Clear description of what the bug is

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
 - OS: [e.g., macOS]
 - Browser: [e.g., Chrome 120]
 - Version: [e.g., v0.2.0]

**Additional context**
Any other context about the problem
```

### Feature Requests
Use the feature request template:

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of what you want to happen

**Describe alternatives considered**
Alternative solutions or features you've considered

**Additional context**
Mockups, examples, or other context
```

### Issue Labels
- `bug` - Something isn't working
- `feature` - New feature request
- `enhancement` - Improvement to existing feature
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - High priority
- `priority: low` - Low priority

---

## Component Development

### Creating New Components
```bash
# 1. Create component file
touch components/features/NewFeature.tsx

# 2. Implement component
# See COMPONENT_REFERENCE.md for examples

# 3. Add to index exports
# components/features/index.ts
export { NewFeature } from './NewFeature';

# 4. Document in COMPONENT_REFERENCE.md
```

### Component Checklist
- [ ] TypeScript interfaces for props
- [ ] Proper prop destructuring
- [ ] Responsive design (mobile-first)
- [ ] Accessibility (aria-labels, keyboard nav)
- [ ] Error boundaries where appropriate
- [ ] Loading states
- [ ] Empty states
- [ ] Consistent with design system

---

## Testing (When Implemented)

### Unit Tests
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist
- [ ] Desktop (Chrome, Firefox, Safari)
- [ ] Mobile (iOS Safari, Chrome Android)
- [ ] Tablet (iPad)
- [ ] Dark mode (if applicable)
- [ ] Slow network (throttle in DevTools)
- [ ] Different screen sizes

---

## Release Process (For Maintainers)

### Version Bumping
```bash
# Patch (0.1.0 → 0.1.1)
npm version patch

# Minor (0.1.0 → 0.2.0)
npm version minor

# Major (0.1.0 → 1.0.0)
npm version major
```

### Changelog Updates
Update CHANGELOG.md with:
- Version number and date
- Added features
- Changed behavior
- Fixed bugs
- Removed features
- Security updates

### Release Checklist
- [ ] All tests passing
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] Release notes written
- [ ] Production deployment tested

---

## Questions?

- **Documentation**: Check [/docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/your-username/paradex/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/paradex/discussions)
- **Email**: dev@paradex.io

---

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to Paradex! 🚀
